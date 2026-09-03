import { NextResponse } from 'next/server';
import { z } from 'zod';
import { KlaviyoClient, REQUIRED_SCOPES, toUserMessage } from '@crm-canvas/klaviyo';
import { InMemoryCredentialProvider } from '@/lib/credentials';

export const runtime = 'nodejs';
// The key is supplied per request and must never be cached at the edge.
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  privateKey: z.string().min(1, 'Enter a Klaviyo private API key.'),
});

/**
 * Validates a Klaviyo private API key and returns the account it belongs to.
 *
 * The key arrives in the request body, is used for exactly one call, and is
 * never persisted or logged. The response deliberately carries no echo of it.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid request.' },
      { status: 400 },
    );
  }

  const credentials = await new InMemoryCredentialProvider(
    parsed.data.privateKey.trim(),
  ).getCredentials();

  try {
    const account = await new KlaviyoClient({ credentials }).getAccount();
    return NextResponse.json({ ok: true, account, requiredScopes: REQUIRED_SCOPES });
  } catch (error) {
    // toUserMessage strips internals and guarantees no credential in the body.
    return NextResponse.json({ ok: false, error: toUserMessage(error) }, { status: 400 });
  }
}
