/**
 * Klaviyo, called from the server so ad blockers cannot drop sign-ups.
 * Uses Klaviyo's client endpoints, which only need the public company ID.
 * No API secret is stored anywhere in this project.
 */
import { site } from '@/data/site';

const BASE = 'https://a.klaviyo.com/client';

/** Events only need the company ID. Sign-ups also need the master list. */
export const klaviyoReady = (needsList = false) =>
  Boolean(site.klaviyo.companyId) && (!needsList || Boolean(site.klaviyo.listId));

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const LOOM_RE = /^(https?:\/\/)?(www\.)?loom\.com\/share\/[\w-]+/i;

async function post(path: 'subscriptions' | 'events', body: unknown): Promise<void> {
  const res = await fetch(`${BASE}/${path}/?company_id=${encodeURIComponent(site.klaviyo.companyId)}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/vnd.api+json',
      accept: 'application/vnd.api+json',
      revision: site.klaviyo.revision,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Klaviyo ${path} returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
}

type Props = Record<string, string | number | boolean | string[] | undefined>;

function profile(email: string, firstName?: string, properties: Props = {}, subscribe = false) {
  return {
    data: {
      type: 'profile',
      attributes: {
        email,
        ...(firstName ? { first_name: firstName } : {}),
        properties,
        ...(subscribe ? { subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } } } : {}),
      },
    },
  };
}

/** Add someone to a list with email marketing consent. */
export function subscribe(opts: { email: string; firstName?: string; listId: string; source: string; properties?: Props }) {
  return post('subscriptions', {
    data: {
      type: 'subscription',
      attributes: {
        profile: profile(opts.email, opts.firstName, opts.properties, true),
        custom_source: opts.source,
      },
      relationships: { list: { data: { type: 'list', id: opts.listId } } },
    },
  });
}

/** Record an event against a profile. Flows in Klaviyo are triggered by these. */
export function track(opts: { email: string; firstName?: string; metric: string; properties?: Props; profileProperties?: Props }) {
  return post('events', {
    data: {
      type: 'event',
      attributes: {
        properties: opts.properties ?? {},
        metric: { data: { type: 'metric', attributes: { name: opts.metric } } },
        profile: profile(opts.email, opts.firstName, opts.profileProperties),
      },
    },
  });
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/** Trim, cap length and drop anything that is not a string. */
export function clean(value: unknown, max = 300): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * Shared guard for the form endpoints. Returns a Response to send straight back,
 * or the parsed body when the request should go on to Klaviyo.
 */
export async function readForm(request: Request, needsList = false): Promise<Response | Record<string, unknown>> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }
  // Honeypot: real people never fill this in. Pretend it worked.
  if (clean(body.company)) return json({ ok: true });
  if (!EMAIL_RE.test(clean(body.email))) return json({ ok: false, error: 'email', fields: ['email'] }, 422);
  // `pnpm dev` never sends to Klaviyo unless KLAVIYO_LIVE=1 is in .env, so testing does not create profiles.
  if (import.meta.env.DEV && import.meta.env.KLAVIYO_LIVE !== '1') return json({ ok: true, simulated: true });
  if (!klaviyoReady(needsList)) return json({ ok: false, error: 'not_configured' }, 503);
  return body;
}
