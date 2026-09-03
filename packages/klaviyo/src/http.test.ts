import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { KlaviyoHttpClient } from './http.js';
import { KlaviyoAuthError, KlaviyoSchemaError, KlaviyoApiError } from './errors.js';
import { RateLimiter } from './rate-limit.js';
import { collectionSchema, resourceSchema } from './schemas/json-api.js';
import { KLAVIYO_API_REVISION } from './config.js';

const itemSchema = resourceSchema('thing', z.object({ name: z.string() }).passthrough());
const pageSchema = collectionSchema(itemSchema);

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/vnd.api+json' },
    ...init,
  });
}

function makeItem(id: string) {
  return { type: 'thing', id, attributes: { name: `item-${id}` } };
}

/** No real waiting in unit tests: limits are exercised separately. */
function fastClient(fetchImpl: typeof fetch, overrides = {}) {
  return new KlaviyoHttpClient({
    credentials: { privateKey: 'pk_test_secret_value' },
    fetchImpl,
    maxRetries: 2,
    rateLimiter: new RateLimiter({
      accounts: { burst: 1000, steady: 100_000 },
      campaigns: { burst: 1000, steady: 100_000 },
    }),
    ...overrides,
  });
}

describe('KlaviyoHttpClient.request', () => {
  it('sends the pinned revision, auth and JSON:API accept headers', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: [] }));
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    await client.request({ path: '/api/things', rateLimitClass: 'campaigns' }, pageSchema);

    const [, init] = fetchImpl.mock.calls[0]!;
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get('revision')).toBe(KLAVIYO_API_REVISION);
    expect(headers.get('authorization')).toBe('Klaviyo-API-Key pk_test_secret_value');
    expect(headers.get('accept')).toBe('application/vnd.api+json');
  });

  it('appends query parameters', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: [] }));
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    await client.request(
      {
        path: '/api/things',
        query: { filter: 'equals(a,"b")', 'page[size]': 100, skipped: undefined },
        rateLimitClass: 'campaigns',
      },
      pageSchema,
    );

    const url = new URL(fetchImpl.mock.calls[0]![0] as string);
    expect(url.pathname).toBe('/api/things');
    expect(url.searchParams.get('filter')).toBe('equals(a,"b")');
    expect(url.searchParams.get('page[size]')).toBe('100');
    expect(url.searchParams.has('skipped')).toBe(false);
  });

  it('throws a schema error when the response shape is wrong', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: [{ type: 'thing', id: '1' }] }));
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    await expect(
      client.request({ path: '/api/things', rateLimitClass: 'campaigns' }, pageSchema),
    ).rejects.toBeInstanceOf(KlaviyoSchemaError);
  });

  it('does not retry a 401 and never leaks the key in the message', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(
        { errors: [{ detail: 'Invalid API key pk_test_secret_value provided' }] },
        { status: 401 },
      ),
    );
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    const error = await client
      .request({ path: '/api/accounts', rateLimitClass: 'accounts' }, pageSchema)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(KlaviyoAuthError);
    expect((error as KlaviyoAuthError).message).not.toContain('pk_test_secret_value');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('does not blame the API key when a proxy returns 403 with a non-JSON:API body', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('Forbidden: egress policy denied CONNECT', {
          status: 403,
          headers: { 'content-type': 'text/plain' },
        }),
    );
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    const error = await client
      .request({ path: '/api/accounts', rateLimitClass: 'accounts' }, pageSchema)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(KlaviyoApiError);
    expect(error).not.toBeInstanceOf(KlaviyoAuthError);
    expect((error as KlaviyoApiError).message).toMatch(/before reaching Klaviyo/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('still treats a genuine Klaviyo 403 as an auth error', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(
        { errors: [{ detail: 'The API key does not have the required scope.' }] },
        { status: 403 },
      ),
    );
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    await expect(
      client.request({ path: '/api/accounts', rateLimitClass: 'accounts' }, pageSchema),
    ).rejects.toBeInstanceOf(KlaviyoAuthError);
  });

  it('retries a 429 using Retry-After and then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ errors: [{ detail: 'rate limited' }] }, {
          status: 429,
          headers: { 'retry-after': '0' },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [makeItem('1')] }));
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    const result = await client.request(
      { path: '/api/things', rateLimitClass: 'campaigns' },
      pageSchema,
    );

    expect(result.data).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('surfaces the JSON:API error detail for a 400', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ errors: [{ detail: 'filter is required' }] }, { status: 400 }),
    );
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    const error = await client
      .request({ path: '/api/campaigns', rateLimitClass: 'campaigns' }, pageSchema)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(KlaviyoApiError);
    expect((error as KlaviyoApiError).message).toBe('filter is required');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe('KlaviyoHttpClient pagination', () => {
  it('follows links.next to exhaustion and stops when next is absent', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [makeItem('1'), makeItem('2')],
          links: { next: 'https://a.klaviyo.com/api/things?page%5Bcursor%5D=abc' },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [makeItem('3')], links: { next: null } }));
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    const items = await client.collect(
      { path: '/api/things', query: { 'page[size]': 100 }, rateLimitClass: 'campaigns' },
      pageSchema,
    );

    expect(items.map((i) => i.id)).toEqual(['1', '2', '3']);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('uses the next link verbatim so the opaque cursor is not re-encoded', async () => {
    const nextUrl = 'https://a.klaviyo.com/api/things?page%5Bcursor%5D=WzE2OTk%3D';
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: [makeItem('1')], links: { next: nextUrl } }))
      .mockResolvedValueOnce(jsonResponse({ data: [] }));
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    await client.collect(
      { path: '/api/things', query: { 'page[size]': 100 }, rateLimitClass: 'campaigns' },
      pageSchema,
    );

    expect(fetchImpl.mock.calls[1]![0]).toBe(nextUrl);
  });

  it('refuses to page forever when links.next never clears', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({ data: [makeItem('x')], links: { next: 'https://a.klaviyo.com/api/things' } }),
    );
    const client = fastClient(fetchImpl as unknown as typeof fetch);

    await expect(
      client.collect(
        { path: '/api/things', rateLimitClass: 'campaigns' },
        pageSchema,
        3,
      ),
    ).rejects.toThrow(/exceeded 3 pages/);
  });
});
