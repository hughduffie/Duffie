/**
 * Klaviyo API configuration.
 *
 * The revision is pinned to a single constant so a revision bump is a one-line
 * change. Verified against github.com/klaviyo/openapi @ main (info.version).
 *
 * Note: revisions 2026-04-15.pre / 2026-07-15.pre introduce an omni-channel
 * campaign model (audiences / messages / variations) with GA targeted at
 * 2026-10-15. When that lands, the campaign resource shape changes and only
 * this package needs to know.
 */
export const KLAVIYO_API_REVISION = '2026-07-15';

export const KLAVIYO_BASE_URL = 'https://a.klaviyo.com';

export const KLAVIYO_JSON_API_MEDIA_TYPE = 'application/vnd.api+json';

/**
 * The read-only scopes this application requires on a Klaviyo private API key.
 * Surfaced in the UI so an operator can create a correctly-scoped key up front
 * rather than discovering a missing scope deep inside a long audit run.
 */
export const REQUIRED_SCOPES = [
  'accounts:read',
  'campaigns:read',
  'flows:read',
  'templates:read',
  'profiles:read',
  'metrics:read',
] as const;

export type RequiredScope = (typeof REQUIRED_SCOPES)[number];
