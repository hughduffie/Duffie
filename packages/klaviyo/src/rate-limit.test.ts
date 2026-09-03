import { describe, expect, it } from 'vitest';
import { RateLimiter, RATE_LIMIT_CLASSES } from './rate-limit.js';

describe('RATE_LIMIT_CLASSES', () => {
  it('matches the limits published in the Klaviyo OpenAPI spec', () => {
    // These are the values that make the reporting strategy necessary; a silent
    // drift here would let a future change reintroduce per-message reporting.
    expect(RATE_LIMIT_CLASSES.reporting).toEqual({ burst: 1, steady: 2, daily: 225 });
    expect(RATE_LIMIT_CLASSES.flows).toEqual({ burst: 3, steady: 60 });
    expect(RATE_LIMIT_CLASSES.templateRender).toEqual({ burst: 3, steady: 60 });
    expect(RATE_LIMIT_CLASSES.campaigns).toEqual({ burst: 10, steady: 150 });
    expect(RATE_LIMIT_CLASSES.accounts).toEqual({ burst: 1, steady: 15 });
  });
});

describe('RateLimiter', () => {
  it('lets a burst through up to capacity without waiting', async () => {
    const limiter = new RateLimiter({ campaigns: { burst: 5, steady: 300 } });
    const started = Date.now();
    await Promise.all(
      Array.from({ length: 5 }, () => limiter.run('campaigns', async () => Date.now())),
    );
    expect(Date.now() - started).toBeLessThan(200);
  });

  it('delays a call once the per-second bucket is spent', async () => {
    const limiter = new RateLimiter({ campaigns: { burst: 2, steady: 1000 } });
    const started = Date.now();
    for (let i = 0; i < 3; i++) {
      await limiter.run('campaigns', async () => undefined);
    }
    // The third call has to wait for the bucket to refill one token (~500ms at
    // 2/s), so it cannot complete immediately.
    expect(Date.now() - started).toBeGreaterThan(300);
  });

  it('tracks the reporting daily budget', async () => {
    const limiter = new RateLimiter({ reporting: { burst: 100, steady: 1000, daily: 3 } });
    expect(limiter.dailyRemaining('reporting')).toBe(3);
    await limiter.run('reporting', async () => undefined);
    await limiter.run('reporting', async () => undefined);
    expect(limiter.dailyRemaining('reporting')).toBe(1);
  });

  it('reports no daily budget for classes without one', () => {
    const limiter = new RateLimiter({ campaigns: { burst: 10, steady: 150 } });
    expect(limiter.dailyRemaining('campaigns')).toBeNull();
  });

  it('keeps the queue alive after a rejected call', async () => {
    const limiter = new RateLimiter({ campaigns: { burst: 100, steady: 1000 } });
    await expect(
      limiter.run('campaigns', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    await expect(limiter.run('campaigns', async () => 'ok')).resolves.toBe('ok');
  });

  it('does not let one class block another', async () => {
    const limiter = new RateLimiter({
      reporting: { burst: 1, steady: 1, daily: 225 },
      templates: { burst: 75, steady: 750 },
    });
    await limiter.run('reporting', async () => undefined);
    const started = Date.now();
    await limiter.run('templates', async () => undefined);
    expect(Date.now() - started).toBeLessThan(100);
  });
});
