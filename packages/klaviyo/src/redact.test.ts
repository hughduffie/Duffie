import { describe, expect, it } from 'vitest';
import { redactDeep, redactSecrets, REDACTED } from './redact.js';

describe('redactSecrets', () => {
  it('removes a private key appearing anywhere in a string', () => {
    const out = redactSecrets('request failed with key pk_abc123DEF456 attached');
    expect(out).not.toContain('pk_abc123DEF456');
    expect(out).toContain(REDACTED);
  });

  it('removes the credential from an Authorization header', () => {
    const out = redactSecrets('Authorization: Klaviyo-API-Key pk_livesecret999');
    expect(out).toBe(`Authorization: Klaviyo-API-Key ${REDACTED}`);
  });

  it('leaves innocent text alone', () => {
    expect(redactSecrets('campaign pk not found')).toBe('campaign pk not found');
  });
});

describe('redactDeep', () => {
  it('drops values under credential-named keys', () => {
    const out = redactDeep({ authorization: 'pk_x1', nested: { apiKey: 'pk_x2', name: 'ok' } });
    expect(out).toEqual({
      authorization: REDACTED,
      nested: { apiKey: REDACTED, name: 'ok' },
    });
  });

  it('scrubs keys embedded in ordinary string values', () => {
    const out = redactDeep({ detail: 'bad key pk_deadbeef00' }) as { detail: string };
    expect(out.detail).not.toContain('pk_deadbeef00');
  });

  it('does not recurse without bound', () => {
    let deep: Record<string, unknown> = { value: 'leaf' };
    for (let i = 0; i < 20; i++) deep = { nested: deep };
    expect(() => redactDeep(deep)).not.toThrow();
  });
});
