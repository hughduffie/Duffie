import { redactDeep, redactSecrets } from './redact.js';

/**
 * Errors carry two messages by design:
 *  - `message`      — safe to show an operator, no internals, no credentials.
 *  - `developer`    — structured detail for the audit's error log, still redacted.
 */
export class KlaviyoError extends Error {
  readonly developer: Record<string, unknown>;

  constructor(message: string, developer: Record<string, unknown> = {}) {
    super(redactSecrets(message));
    this.name = new.target.name;
    this.developer = redactDeep(developer) as Record<string, unknown>;
  }
}

/** Non-2xx response from Klaviyo. */
export class KlaviyoApiError extends KlaviyoError {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | null,
    developer: Record<string, unknown> = {},
  ) {
    super(message, { ...developer, status, requestId });
  }
}

/** 401/403 — the key is wrong, revoked, or missing a scope. */
export class KlaviyoAuthError extends KlaviyoApiError {}

/** 429 — rate limited. `retryAfterMs` is from the Retry-After header when present. */
export class KlaviyoRateLimitError extends KlaviyoApiError {
  constructor(
    message: string,
    status: number,
    requestId: string | null,
    readonly retryAfterMs: number | null,
    developer: Record<string, unknown> = {},
  ) {
    super(message, status, requestId, { ...developer, retryAfterMs });
  }
}

/** The response did not match the schema we validated against the OpenAPI spec. */
export class KlaviyoSchemaError extends KlaviyoError {}

/** A guard tripped before any request was sent (e.g. the daily reporting budget). */
export class KlaviyoBudgetError extends KlaviyoError {}

/**
 * Turns any thrown value into an operator-safe sentence.
 * Used at API and UI boundaries so raw stack traces never surface.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof KlaviyoAuthError) {
    return error.status === 403
      ? 'That API key is missing a required scope. It needs read access to accounts, campaigns, flows, templates, profiles and metrics.'
      : 'That API key was rejected by Klaviyo. Check it was copied in full and has not been revoked.';
  }
  if (error instanceof KlaviyoRateLimitError) {
    return 'Klaviyo rate-limited the request. This will retry automatically.';
  }
  if (error instanceof KlaviyoSchemaError) {
    return 'Klaviyo returned data in an unexpected shape. This usually means the API revision has moved on.';
  }
  if (error instanceof KlaviyoError) return error.message;
  if (error instanceof Error) return redactSecrets(error.message);
  return 'An unexpected error occurred.';
}
