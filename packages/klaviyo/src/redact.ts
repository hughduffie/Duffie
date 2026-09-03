/**
 * Redaction helpers.
 *
 * A Klaviyo private key must never reach a log line, an error message, or a
 * response body. Every error thrown by this package passes through here first.
 */

/** Klaviyo private keys are `pk_` followed by a hex string. */
const PRIVATE_KEY_PATTERN = /pk_[A-Za-z0-9]{4,}/g;

/** `Authorization: Klaviyo-API-Key <key>` in any casing. */
const AUTH_HEADER_PATTERN = /(Klaviyo-API-Key\s+)\S+/gi;

export const REDACTED = '[redacted]';

/**
 * Strips anything that looks like a credential out of a string.
 * Deliberately aggressive: a false positive costs a little log readability,
 * a false negative leaks a key.
 */
export function redactSecrets(input: string): string {
  return input
    .replace(AUTH_HEADER_PATTERN, `$1${REDACTED}`)
    .replace(PRIVATE_KEY_PATTERN, REDACTED);
}

const SENSITIVE_KEYS = new Set([
  'authorization',
  'api_key',
  'apikey',
  'private_key',
  'privatekey',
  'key',
  'token',
  'access_token',
  'secret',
]);

/**
 * Deep-redacts an arbitrary value for safe logging. Strings are scrubbed for
 * key patterns; object keys that name a credential are dropped entirely.
 */
export function redactDeep(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[truncated]';
  if (typeof value === 'string') return redactSecrets(value);
  if (Array.isArray(value)) return value.map((v) => redactDeep(v, depth + 1));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? REDACTED : redactDeep(v, depth + 1);
    }
    return out;
  }
  return value;
}
