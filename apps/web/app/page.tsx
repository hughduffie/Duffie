'use client';

import { useState } from 'react';
import { ConnectKlaviyo, type ConnectedAccount } from './connect-klaviyo';

/**
 * New audit.
 *
 * Phase 1 covers step 1 of the flow: connect a Klaviyo account and confirm the
 * key resolves to the right company. Discovery configuration lands in Phase 2.
 */
export default function NewAuditPage() {
  const [account, setAccount] = useState<ConnectedAccount | null>(null);

  return (
    <>
      <h1>New audit</h1>
      <p className="subtitle">
        Connect a Klaviyo account, then configure what the audit should cover.
      </p>

      <ConnectKlaviyo onConnected={setAccount} />

      <section className="panel" aria-labelledby="config-heading">
        <h2 id="config-heading" style={{ fontSize: 15, margin: '0 0 4px' }}>
          Audit configuration
        </h2>
        <p className="hint" style={{ margin: 0 }}>
          {account
            ? 'Campaign date range, statuses and reporting period arrive in Phase 2.'
            : 'Connect an account to continue.'}
        </p>
      </section>
    </>
  );
}
