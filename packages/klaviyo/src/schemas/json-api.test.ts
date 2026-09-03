import { describe, expect, it } from 'vitest';
import { filter } from './json-api.js';

describe('filter', () => {
  it('builds the required email-channel campaign filter', () => {
    expect(filter.equals('messages.channel', 'email')).toBe('equals(messages.channel,"email")');
  });

  it('builds an any() clause for status lists', () => {
    expect(filter.any('status', ['Sent', 'Scheduled'])).toBe('any(status,["Sent","Scheduled"])');
  });

  it('serialises dates as ISO 8601', () => {
    const clause = filter.greaterOrEqual('scheduled_at', new Date('2026-01-01T00:00:00.000Z'));
    expect(clause).toBe('greater-or-equal(scheduled_at,"2026-01-01T00:00:00.000Z")');
  });

  it('combines clauses with and()', () => {
    const clause = filter.and(
      filter.equals('messages.channel', 'email'),
      filter.any('status', ['Sent']),
    );
    expect(clause).toBe('and(equals(messages.channel,"email"),any(status,["Sent"]))');
  });

  it('does not wrap a single clause in and()', () => {
    expect(filter.and(filter.equals('messages.channel', 'email'), undefined)).toBe(
      'equals(messages.channel,"email")',
    );
  });

  it('escapes quotes so a campaign name cannot break the expression', () => {
    expect(filter.contains('name', 'Black "Friday"')).toBe('contains(name,"Black \\"Friday\\"")');
  });

  it('rejects an empty clause list rather than sending an invalid filter', () => {
    expect(() => filter.and(undefined)).toThrow();
  });
});
