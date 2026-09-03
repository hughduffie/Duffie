import { z } from 'zod';
import { collectionSchema, resourceSchema } from './json-api.js';

/**
 * GET /api/accounts
 * Verified against the OpenAPI spec: `AccountResponseObjectResource`.
 * Required attributes there: test_account, contact_information, timezone,
 * preferred_currency, public_api_key, locale.
 */
export const contactInformationSchema = z
  .object({
    default_sender_name: z.string().nullish(),
    default_sender_email: z.string().nullish(),
    website_url: z.string().nullish(),
    organization_name: z.string().nullish(),
    street_address: z.unknown().optional(),
  })
  .passthrough();

export const accountAttributesSchema = z
  .object({
    test_account: z.boolean(),
    contact_information: contactInformationSchema,
    industry: z.string().nullish(),
    timezone: z.string(),
    preferred_currency: z.string(),
    public_api_key: z.string(),
    locale: z.string(),
  })
  .passthrough();

export const accountResourceSchema = resourceSchema('account', accountAttributesSchema);
export const accountCollectionSchema = collectionSchema(accountResourceSchema);

export type AccountResource = z.infer<typeof accountResourceSchema>;

/** The normalized account shape the rest of the application consumes. */
export interface KlaviyoAccount {
  /** Klaviyo company ID (the public API key doubles as the site ID). */
  id: string;
  companyName: string;
  timezone: string;
  /** ISO 4217 code from the account, e.g. "GBP". Never hard-coded. */
  currency: string;
  locale: string;
  isTestAccount: boolean;
  publicApiKey: string;
}

export function normalizeAccount(resource: AccountResource): KlaviyoAccount {
  const contact = resource.attributes.contact_information;
  return {
    id: resource.id,
    // Klaviyo has no dedicated "company name" field; the organization name on
    // the CAN-SPAM contact block is what the UI shows, with the sender name and
    // then the account ID as fallbacks.
    companyName:
      contact.organization_name?.trim() ||
      contact.default_sender_name?.trim() ||
      resource.id,
    timezone: resource.attributes.timezone,
    currency: resource.attributes.preferred_currency,
    locale: resource.attributes.locale,
    isTestAccount: resource.attributes.test_account,
    publicApiKey: resource.attributes.public_api_key,
  };
}
