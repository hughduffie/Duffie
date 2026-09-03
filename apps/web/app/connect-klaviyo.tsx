'use client';

import { useState, type FormEvent } from 'react';

export interface ConnectedAccount {
  id: string;
  companyName: string;
  timezone: string;
  currency: string;
  locale: string;
  isTestAccount: boolean;
}

interface ValidateResponse {
  ok: boolean;
  account?: ConnectedAccount;
  requiredScopes?: string[];
  error?: string;
}

const REQUIRED_SCOPES = [
  'accounts:read',
  'campaigns:read',
  'flows:read',
  'templates:read',
  'profiles:read',
  'metrics:read',
];

/**
 * Klaviyo connection step.
 *
 * The key lives in component state and in the request body only. It is never
 * put in the URL, in localStorage, or in a log line.
 */
export function ConnectKlaviyo({
  onConnected,
}: {
  onConnected: (account: ConnectedAccount) => void;
}) {
  const [privateKey, setPrivateKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [account, setAccount] = useState<ConnectedAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus('checking');
    setError(null);

    try {
      const response = await fetch('/api/klaviyo/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ privateKey }),
      });
      const body = (await response.json()) as ValidateResponse;

      if (!body.ok || !body.account) {
        setStatus('error');
        setError(body.error ?? 'Could not validate that key.');
        return;
      }

      setAccount(body.account);
      setStatus('connected');
      onConnected(body.account);
    } catch {
      setStatus('error');
      setError('Could not reach the server. Check the app is running and try again.');
    }
  }

  return (
    <section className="panel" aria-labelledby="connect-heading">
      <h2 id="connect-heading" style={{ fontSize: 15, margin: '0 0 12px' }}>
        Klaviyo account
      </h2>

      <form onSubmit={handleSubmit}>
        <label htmlFor="private-key">Private API key</label>
        <input
          id="private-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="pk_..."
          value={privateKey}
          onChange={(e) => {
            setPrivateKey(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
        />
        <p className="hint">
          Read-only scopes required:{' '}
          {REQUIRED_SCOPES.map((scope) => (
            <code className="scope" key={scope}>
              {scope}
            </code>
          ))}
        </p>
        <p className="hint">
          The key is used for this session only. It is never written to the database in
          plaintext and never appears in logs.
        </p>

        <div className="row">
          <button type="submit" disabled={status === 'checking' || privateKey.trim() === ''}>
            {status === 'checking' ? 'Checking…' : 'Validate key'}
          </button>
        </div>
      </form>

      {status === 'error' && error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}

      {status === 'connected' && account && (
        <div className="notice ok">
          <strong>Connected to {account.companyName}</strong>
          <dl className="facts">
            <dt>Account ID</dt>
            <dd>{account.id}</dd>
            <dt>Timezone</dt>
            <dd>{account.timezone}</dd>
            <dt>Currency</dt>
            <dd>{account.currency}</dd>
            <dt>Locale</dt>
            <dd>{account.locale}</dd>
            {account.isTestAccount && (
              <>
                <dt>Note</dt>
                <dd>This is a Klaviyo test account.</dd>
              </>
            )}
          </dl>
        </div>
      )}
    </section>
  );
}
