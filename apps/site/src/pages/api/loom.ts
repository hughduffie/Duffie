/**
 * POST /api/loom
 * The Get in touch intake. Records a "Submitted Loom intake" event in Klaviyo.
 * A Klaviyo flow on that event sends the confirmation to the sender and the details to Hugh.
 * The sender is not added to any marketing list.
 */
import type { APIRoute } from 'astro';
import { site } from '@/data/site';
import { LOOM_RE, clean, json, readForm, track } from '@/lib/klaviyo';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await readForm(request);
  if (body instanceof Response) return body;

  const email = clean(body.email);
  const firstName = clean(body.firstName, 80);
  const brand = clean(body.brand, 200);
  const loom = clean(body.loom, 300);
  const revenue = clean(body.revenue, 120);

  const fields: string[] = [];
  if (!firstName) fields.push('firstName');
  if (!brand) fields.push('brand');
  if (!LOOM_RE.test(loom)) fields.push('loom');
  if (body.consent !== true) fields.push('consent');
  if (fields.length) return json({ ok: false, error: 'invalid', fields }, 422);

  try {
    await track({
      email,
      firstName,
      metric: site.klaviyo.metrics.loomSubmitted,
      properties: { brand, loom_link: loom, revenue },
      profileProperties: { brand, loom_link: loom, ...(revenue ? { revenue_band: revenue } : {}) },
    });
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'upstream' }, 502);
  }
};
