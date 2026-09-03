import { describe, expect, it } from 'vitest';
import { accountCollectionSchema, normalizeAccount } from './account.js';

/** Shaped from the OpenAPI example for AccountResponseObjectResource. */
const fixture = {
  data: [
    {
      type: 'account',
      id: 'AbC123',
      attributes: {
        test_account: false,
        contact_information: {
          default_sender_name: 'Duffie Sender',
          default_sender_email: 'hello@example.com',
          website_url: 'https://example.com',
          organization_name: 'Duffie Ltd',
          street_address: { address1: '1 Example St', city: 'London', country: 'GB' },
        },
        industry: 'Apparel',
        timezone: 'Europe/London',
        preferred_currency: 'GBP',
        public_api_key: 'AbC123',
        locale: 'en-GB',
      },
      links: { self: 'https://a.klaviyo.com/api/accounts/AbC123/' },
    },
  ],
};

describe('account schema', () => {
  it('parses a real-shaped accounts response', () => {
    const parsed = accountCollectionSchema.parse(fixture);
    expect(parsed.data).toHaveLength(1);
  });

  it('tolerates additional attributes Klaviyo may add later', () => {
    const withExtra = structuredClone(fixture);
    (withExtra.data[0]!.attributes as Record<string, unknown>).some_new_field = 'value';
    expect(() => accountCollectionSchema.parse(withExtra)).not.toThrow();
  });

  it('rejects a response missing a required attribute', () => {
    const broken = structuredClone(fixture);
    delete (broken.data[0]!.attributes as Record<string, unknown>).preferred_currency;
    expect(() => accountCollectionSchema.parse(broken)).toThrow();
  });
});

describe('normalizeAccount', () => {
  it('takes the company name from the organization name', () => {
    const account = normalizeAccount(accountCollectionSchema.parse(fixture).data[0]!);
    expect(account.companyName).toBe('Duffie Ltd');
  });

  it('carries currency and timezone from the account, not a constant', () => {
    const account = normalizeAccount(accountCollectionSchema.parse(fixture).data[0]!);
    expect(account.currency).toBe('GBP');
    expect(account.timezone).toBe('Europe/London');
  });

  it('falls back to the sender name when no organization name is set', () => {
    const noOrg = structuredClone(fixture);
    noOrg.data[0]!.attributes.contact_information.organization_name = '';
    const account = normalizeAccount(accountCollectionSchema.parse(noOrg).data[0]!);
    expect(account.companyName).toBe('Duffie Sender');
  });

  it('falls back to the account id when no name is available at all', () => {
    const nameless = structuredClone(fixture);
    nameless.data[0]!.attributes.contact_information.organization_name = null;
    nameless.data[0]!.attributes.contact_information.default_sender_name = null;
    const account = normalizeAccount(accountCollectionSchema.parse(nameless).data[0]!);
    expect(account.companyName).toBe('AbC123');
  });
});
