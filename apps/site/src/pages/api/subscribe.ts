/**
 * POST /api/subscribe
 * Handles three forms: Monthly notes, the resource gate and the values report.
 */
import type { APIRoute } from 'astro';
import { site } from '@/data/site';
import { resources } from '@/data/resources';
import { clean, json, readForm, subscribe, track } from '@/lib/klaviyo';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const body = await readForm(request);
  if (body instanceof Response) return body;

  const email = clean(body.email);
  const firstName = clean(body.firstName, 80);
  const form = clean(body.form, 20);
  const { lists, metrics } = site.klaviyo;

  try {
    if (form === 'notes') {
      await subscribe({ email, listId: lists.monthlyNotes, source: 'Monthly notes sign-up' });
      return json({ ok: true });
    }

    if (form === 'resource') {
      const resource = resources.find((r) => r.slug === clean(body.resource, 80) && r.kind === 'guide');
      if (!resource) return json({ ok: false, error: 'resource' }, 422);
      if (body.consent !== true) return json({ ok: false, error: 'consent', fields: ['consent'] }, 422);
      const role = clean(body.role, 120);
      await subscribe({
        email,
        firstName,
        listId: lists.resourceDownloads,
        source: `Resource: ${resource.slug}`,
        properties: { last_resource: resource.slug, ...(role ? { role } : {}) },
      });
      await track({
        email,
        firstName,
        metric: metrics.resourceRequested,
        properties: { resource: resource.slug, resource_title: resource.title, url: `${site.url}/resources/${resource.slug}` },
      });
      return json({ ok: true });
    }

    if (form === 'values') {
      const values = Array.isArray(body.values) ? body.values.map((v) => clean(v, 60)).filter(Boolean).slice(0, 10) : [];
      const themes = Array.isArray(body.themes) ? body.themes.map((v) => clean(v, 60)).filter(Boolean).slice(0, 9) : [];
      const props = {
        values_top: clean(body.topValue, 60),
        values_top_five: values.slice(0, 5),
        values_also: values.slice(5),
        values_themes: themes,
        values_notes: clean(body.notes, 2000),
      };
      await subscribe({ email, firstName, listId: lists.valuesExercise, source: 'Values exercise', properties: props });
      await track({ email, firstName, metric: metrics.valuesReport, properties: props });
      if (body.consent === true) {
        await subscribe({ email, firstName, listId: lists.monthlyNotes, source: 'Values exercise report' });
      }
      return json({ ok: true });
    }

    return json({ ok: false, error: 'bad_request' }, 400);
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'upstream' }, 502);
  }
};
