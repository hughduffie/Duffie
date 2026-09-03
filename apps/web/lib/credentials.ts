import type { KlaviyoCredentials } from '@crm-canvas/klaviyo';

/**
 * How the application obtains Klaviyo credentials.
 *
 * V1 has exactly one implementation, which keeps the key in the environment or
 * in memory for the duration of a request. The key is never written to the
 * database in plaintext.
 *
 * The hosted product will add `SupabaseVaultCredentialProvider`, which stores
 * an envelope-encrypted key (per-account data key wrapped by a KMS master key)
 * and decrypts it only inside the worker. Because every call site depends on
 * this interface rather than on `process.env`, that is an added implementation
 * and not a refactor.
 */
export interface CredentialProvider {
  getCredentials(): Promise<KlaviyoCredentials>;
}

/** Reads the key from the environment. Used for CLI scripts and local dev. */
export class EnvCredentialProvider implements CredentialProvider {
  constructor(private readonly varName = 'KLAVIYO_PRIVATE_API_KEY') {}

  async getCredentials(): Promise<KlaviyoCredentials> {
    const privateKey = process.env[this.varName];
    if (!privateKey) {
      throw new Error(
        `${this.varName} is not set. Copy .env.example to .env.local and add a Klaviyo private API key.`,
      );
    }
    return { privateKey };
  }
}

/**
 * Holds a key supplied by the operator for the lifetime of one request or job.
 * Nothing is persisted.
 */
export class InMemoryCredentialProvider implements CredentialProvider {
  constructor(private readonly privateKey: string) {}

  async getCredentials(): Promise<KlaviyoCredentials> {
    return { privateKey: this.privateKey };
  }
}
