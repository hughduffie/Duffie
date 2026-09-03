import type { z } from 'zod';
import {
  KLAVIYO_BASE_URL,
  KLAVIYO_API_REVISION,
  KLAVIYO_JSON_API_MEDIA_TYPE,
} from './config.js';
import {
  KlaviyoApiError,
  KlaviyoAuthError,
  KlaviyoRateLimitError,
  KlaviyoSchemaError,
} from './errors.js';
import { RateLimiter, type RateLimitClass } from './rate-limit.js';
import { redactSecrets } from './redact.js';

/**
 * Credentials are passed in, never read from the environment by this package.
 * That keeps the adapter usable with a private key today and an OAuth access
 * token later without touching any call site.
 */
export interface KlaviyoCredentials {
  /** Klaviyo private API key (`pk_...`). */
  privateKey: string;
}

export interface KlaviyoClientOptions {
  credentials: KlaviyoCredentials;
  baseUrl?: string;
  revision?: string;
  /** Share one limiter across clients to keep account-wide limits honest. */
  rateLimiter?: RateLimiter;
  /** Retries for transient failures (429 and 5xx). Default 4. */
  maxRetries?: number;
  /** Per-request timeout in ms. Default 30_000. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  method?: 'GET' | 'POST';
  path: string;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
  rateLimitClass: RateLimitClass;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Retry-After is seconds per RFC 9110; Klaviyo sends the numeric form. */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? Math.max(0, seconds * 1000) : null;
}

/**
 * Klaviyo returns JSON:API errors: `{ errors: [{ title, detail, code, ... }] }`.
 * We surface `detail` because it names the actual problem (e.g. which filter is
 * malformed), and it never contains the API key.
 */
function isJsonApiErrorBody(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const errors = (body as { errors?: unknown }).errors;
  return Array.isArray(errors) && errors.length > 0;
}

function describeErrorBody(body: unknown): string | null {
  if (!isJsonApiErrorBody(body)) return null;
  const errors = (body as { errors: unknown[] }).errors;
  const parts = errors
    .map((e) => {
      if (!e || typeof e !== 'object') return null;
      const { title, detail } = e as { title?: unknown; detail?: unknown };
      return typeof detail === 'string' ? detail : typeof title === 'string' ? title : null;
    })
    .filter((v): v is string => v !== null);
  return parts.length > 0 ? redactSecrets(parts.join('; ')) : null;
}

export class KlaviyoHttpClient {
  private readonly baseUrl: string;
  private readonly revision: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  readonly rateLimiter: RateLimiter;

  constructor(private readonly options: KlaviyoClientOptions) {
    this.baseUrl = options.baseUrl ?? KLAVIYO_BASE_URL;
    this.revision = options.revision ?? KLAVIYO_API_REVISION;
    this.maxRetries = options.maxRetries ?? 4;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.rateLimiter = options.rateLimiter ?? new RateLimiter();
  }

  private buildUrl(path: string, query?: RequestOptions['query']): string {
    // Absolute URLs come from JSON:API `links.next`; use them verbatim so the
    // opaque cursor is never re-encoded.
    if (path.startsWith('http')) return path;
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  private headers(hasBody: boolean): Headers {
    const headers = new Headers({
      Authorization: `Klaviyo-API-Key ${this.options.credentials.privateKey}`,
      accept: KLAVIYO_JSON_API_MEDIA_TYPE,
      revision: this.revision,
    });
    if (hasBody) headers.set('content-type', KLAVIYO_JSON_API_MEDIA_TYPE);
    return headers;
  }

  /** Issues one request, honouring rate limits, retries and redaction. */
  async request<T>(options: RequestOptions, schema: z.ZodType<T>): Promise<T> {
    const { method = 'GET', path, query, body, rateLimitClass } = options;
    const url = this.buildUrl(path, query);
    // The URL is logged and attached to errors, so strip the query of anything
    // sensitive by reporting only the pathname.
    const safeUrl = url.startsWith('http') ? new URL(url).pathname : url;

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.rateLimiter.run(rateLimitClass, () =>
          this.fetchImpl(url, {
            method,
            headers: this.headers(body !== undefined),
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(this.timeoutMs),
          }),
        );

        const requestId = response.headers.get('cf-ray') ?? response.headers.get('x-request-id');

        if (response.ok) {
          const json: unknown = await response.json();
          const parsed = schema.safeParse(json);
          if (!parsed.success) {
            throw new KlaviyoSchemaError(
              `Klaviyo response for ${safeUrl} did not match the expected shape.`,
              { path: safeUrl, revision: this.revision, issues: parsed.error.issues.slice(0, 10) },
            );
          }
          return parsed.data;
        }

        const errorBody: unknown = await response.json().catch(() => null);
        const detail = describeErrorBody(errorBody);
        const fromKlaviyo = isJsonApiErrorBody(errorBody);
        const message = detail ?? `Klaviyo returned ${response.status} for ${safeUrl}.`;

        if (response.status === 401 || response.status === 403) {
          // A 401/403 without a JSON:API error body did not come from Klaviyo —
          // it is a proxy, gateway or network policy rejecting the request
          // before it arrives. Reporting that as a scope problem sends the
          // operator to rotate a key that was never the issue.
          if (!fromKlaviyo) {
            throw new KlaviyoApiError(
              `The request to ${safeUrl} was rejected with ${response.status} before reaching Klaviyo. This usually means a network proxy or firewall is blocking a.klaviyo.com.`,
              response.status,
              requestId,
              { path: safeUrl, rejectedUpstream: true },
            );
          }
          // Never retried: a bad key or a missing scope will not fix itself.
          throw new KlaviyoAuthError(message, response.status, requestId, { path: safeUrl });
        }

        if (response.status === 429) {
          const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
          const error = new KlaviyoRateLimitError(
            message,
            429,
            requestId,
            retryAfterMs,
            { path: safeUrl },
          );
          if (attempt === this.maxRetries) throw error;
          lastError = error;
          await sleep(retryAfterMs ?? backoffMs(attempt));
          continue;
        }

        const error = new KlaviyoApiError(message, response.status, requestId, { path: safeUrl });
        if (response.status >= 500 && attempt < this.maxRetries) {
          lastError = error;
          await sleep(backoffMs(attempt));
          continue;
        }
        throw error;
      } catch (error) {
        // Schema, auth and exhausted-retry errors are terminal.
        if (
          error instanceof KlaviyoSchemaError ||
          error instanceof KlaviyoAuthError ||
          error instanceof KlaviyoApiError
        ) {
          throw error;
        }
        // Network-level failure (DNS, reset, timeout): retry with backoff.
        lastError = error;
        if (attempt === this.maxRetries) break;
        await sleep(backoffMs(attempt));
      }
    }

    throw new KlaviyoApiError(
      `Klaviyo request to ${safeUrl} failed after ${this.maxRetries + 1} attempts.`,
      0,
      null,
      { path: safeUrl, cause: lastError instanceof Error ? lastError.message : String(lastError) },
    );
  }

  /**
   * Walks a JSON:API collection to exhaustion by following `links.next`.
   *
   * Klaviyo uses opaque cursors, so the only correct way to page is to follow
   * the returned link rather than incrementing anything. `maxPages` is a
   * runaway guard, not a business limit.
   */
  async *paginate<T extends { data: unknown[]; links?: { next?: string | null } }>(
    options: RequestOptions,
    schema: z.ZodType<T>,
    maxPages = 500,
  ): AsyncGenerator<T, void, undefined> {
    let next: string | null = options.path;
    let query = options.query;
    let pages = 0;

    while (next !== null) {
      if (++pages > maxPages) {
        throw new KlaviyoApiError(
          `Pagination exceeded ${maxPages} pages; refusing to continue.`,
          0,
          null,
          { path: options.path },
        );
      }
      const page: T = await this.request({ ...options, path: next, query }, schema);
      yield page;
      next = page.links?.next ?? null;
      // `links.next` is fully-qualified and already carries every parameter.
      query = undefined;
    }
  }

  /** Collects every resource across every page into one array. */
  async collect<T extends { data: R[]; links?: { next?: string | null } }, R>(
    options: RequestOptions,
    schema: z.ZodType<T>,
    maxPages = 500,
  ): Promise<R[]> {
    const all: R[] = [];
    for await (const page of this.paginate(options, schema, maxPages)) {
      all.push(...page.data);
    }
    return all;
  }
}

/** Exponential backoff with jitter: ~1s, 2s, 4s, 8s. */
function backoffMs(attempt: number): number {
  const base = 1000 * 2 ** attempt;
  return base + Math.random() * 250;
}
