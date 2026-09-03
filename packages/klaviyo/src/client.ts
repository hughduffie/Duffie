import { KlaviyoHttpClient, type KlaviyoClientOptions } from './http.js';
import { KlaviyoApiError } from './errors.js';
import {
  accountCollectionSchema,
  normalizeAccount,
  type KlaviyoAccount,
} from './schemas/account.js';

/**
 * The application-facing Klaviyo adapter.
 *
 * Every Klaviyo concept the rest of the codebase touches enters through here,
 * already validated and normalized. Nothing outside this package should know
 * that Klaviyo speaks JSON:API, uses cursor pagination, or needs a revision
 * header.
 */
export class KlaviyoClient {
  readonly http: KlaviyoHttpClient;

  constructor(options: KlaviyoClientOptions) {
    this.http = new KlaviyoHttpClient(options);
  }

  /**
   * Fetches the connected account.
   *
   * Doubles as key validation: a private key is scoped to exactly one account,
   * so this returns a single-element collection. A 401 means the key is bad, a
   * 403 means it is missing `accounts:read`.
   */
  async getAccount(): Promise<KlaviyoAccount> {
    const response = await this.http.request(
      { path: '/api/accounts', rateLimitClass: 'accounts' },
      accountCollectionSchema,
    );
    const resource = response.data[0];
    if (!resource) {
      throw new KlaviyoApiError(
        'Klaviyo returned no account for this API key.',
        200,
        null,
        { path: '/api/accounts' },
      );
    }
    return normalizeAccount(resource);
  }
}
