/**
 * Client-side rate limiting.
 *
 * Klaviyo publishes a burst (per-second) and steady (per-minute) limit per
 * endpoint, and reporting endpoints additionally carry a daily cap. Every limit
 * below is copied from `x-klaviyo-ratelimit` in the official OpenAPI spec at
 * revision 2026-07-15 — none of them are guesses.
 *
 * We throttle proactively rather than relying on 429s, because the reporting
 * endpoints allow only 225 calls per day: burning those on retries is not
 * recoverable within the day.
 */

export interface RateLimitSpec {
  /** Requests per second. */
  burst: number;
  /** Requests per minute. */
  steady: number;
  /** Requests per day, where the endpoint declares one. */
  daily?: number;
}

/**
 * Endpoints sharing a limit share a bucket. Names match the Klaviyo docs'
 * grouping so they can be re-verified against the spec.
 */
export const RATE_LIMIT_CLASSES = {
  accounts: { burst: 1, steady: 15 },
  campaigns: { burst: 10, steady: 150 },
  flows: { burst: 3, steady: 60 },
  templates: { burst: 75, steady: 750 },
  templateRender: { burst: 3, steady: 60 },
  profiles: { burst: 75, steady: 750 },
  metrics: { burst: 10, steady: 150 },
  reporting: { burst: 1, steady: 2, daily: 225 },
} as const satisfies Record<string, RateLimitSpec>;

export type RateLimitClass = keyof typeof RATE_LIMIT_CLASSES;

/** A token bucket that refills continuously at `capacity / windowMs`. */
class TokenBucket {
  private tokens: number;
  private lastRefill = Date.now();

  constructor(
    private readonly capacity: number,
    private readonly windowMs: number,
  ) {
    this.tokens = capacity;
  }

  /** Milliseconds until a token is available. 0 when one is available now. */
  private refill(now: number): void {
    const elapsed = now - this.lastRefill;
    if (elapsed <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + (elapsed * this.capacity) / this.windowMs);
    this.lastRefill = now;
  }

  waitMs(now: number): number {
    this.refill(now);
    if (this.tokens >= 1) return 0;
    return Math.ceil(((1 - this.tokens) * this.windowMs) / this.capacity);
  }

  take(now: number): void {
    this.refill(now);
    this.tokens -= 1;
  }
}

/**
 * A hard counter that never refills within the process lifetime. Used for the
 * reporting daily cap, where exceeding the limit is not something a retry fixes.
 */
class DailyCounter {
  private count = 0;
  private windowStart = Date.now();

  constructor(private readonly limit: number) {}

  private roll(now: number): void {
    if (now - this.windowStart >= 86_400_000) {
      this.count = 0;
      this.windowStart = now;
    }
  }

  remaining(now: number): number {
    this.roll(now);
    return this.limit - this.count;
  }

  increment(now: number): void {
    this.roll(now);
    this.count += 1;
  }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Serialises requests within each rate-limit class. Calls in different classes
 * proceed independently; calls in the same class queue behind one another so
 * two concurrent audits cannot together exceed a limit.
 */
export class RateLimiter {
  private readonly buckets = new Map<RateLimitClass, [TokenBucket, TokenBucket]>();
  private readonly daily = new Map<RateLimitClass, DailyCounter>();
  private readonly queues = new Map<RateLimitClass, Promise<unknown>>();

  constructor(private readonly specs: Record<string, RateLimitSpec> = RATE_LIMIT_CLASSES) {}

  private bucketsFor(cls: RateLimitClass): [TokenBucket, TokenBucket] {
    let pair = this.buckets.get(cls);
    if (!pair) {
      const spec = this.specs[cls];
      if (!spec) throw new Error(`Unknown rate limit class: ${cls}`);
      pair = [new TokenBucket(spec.burst, 1000), new TokenBucket(spec.steady, 60_000)];
      this.buckets.set(cls, pair);
      if (spec.daily !== undefined) this.daily.set(cls, new DailyCounter(spec.daily));
    }
    return pair;
  }

  /** Remaining calls in today's budget, or null where the class has no daily cap. */
  dailyRemaining(cls: RateLimitClass): number | null {
    this.bucketsFor(cls);
    return this.daily.get(cls)?.remaining(Date.now()) ?? null;
  }

  /** Runs `fn` once the class's limits allow it. Calls in a class run in order. */
  async run<T>(cls: RateLimitClass, fn: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(cls) ?? Promise.resolve();
    const task = previous.then(async () => {
      const [burst, steady] = this.bucketsFor(cls);
      for (;;) {
        const now = Date.now();
        const wait = Math.max(burst.waitMs(now), steady.waitMs(now));
        if (wait === 0) {
          burst.take(now);
          steady.take(now);
          this.daily.get(cls)?.increment(now);
          break;
        }
        await sleep(wait);
      }
      return fn();
    });
    // Keep the chain alive even when a call rejects, so one failure does not
    // wedge every later call in the same class.
    this.queues.set(
      cls,
      task.catch(() => undefined),
    );
    return task;
  }
}
