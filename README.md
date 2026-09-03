# CRM Canvas

Connects to a Klaviyo account, pulls every campaign and flow email, renders accurate
desktop and mobile previews, attaches Klaviyo's own reported performance figures plus
deterministic content metrics, and emits a JSON manifest that a Figma plugin turns into a
visual audit board.

V1 is an internal tool: one operator, one Klaviyo account at a time, no authentication.
The architecture keeps a multi-tenant SaaS possible later without building any of it now.

## Status

| Phase | Scope | State |
|---|---|---|
| 0 | Monorepo, tooling, tests | Done |
| 1 | Klaviyo client, account validation | Done (live check pending, see below) |
| 2 | Campaign + flow discovery | Not started |
| 3 | Profile resolution and template render | Not started |
| 4 | Playwright desktop + mobile screenshots | Not started |
| 5 | Content metrics | Not started |
| 6 | Reporting API | Not started |
| 7 | Job system, retries, progress | Not started |
| 8 | Supabase persistence and storage | Not started |
| 9 | Manifest generation | Not started |
| 10-11 | Figma plugin, full board | Not started |
| 12 | Hardening | Not started |

## Layout

```
apps/web            Next.js app: operator UI and API routes
apps/worker         Renderer worker (Playwright/Chromium) — Phase 4
apps/figma-plugin   Figma plugin — Phase 10
packages/klaviyo    Klaviyo API adapter: auth, pagination, rate limiting, schemas
packages/shared     Domain models, content metrics, manifest — Phase 5
packages/database   Supabase client, migrations, storage paths — Phase 8
```

The web app never launches Chromium. Rendering is a separate worker process from the
start so it can move to a container platform without a rewrite.

## Local setup

Requires Node 22+ and pnpm 10+.

```bash
pnpm install
cp .env.example .env.local   # then fill in
pnpm test                    # unit tests
pnpm build                   # build workspace packages
pnpm dev:web                 # http://localhost:3000
```

### Klaviyo API key

Create a private API key in Klaviyo under **Settings → API keys → Create private API
key**, with these read-only scopes and nothing more:

```
accounts:read  campaigns:read  flows:read  templates:read  profiles:read  metrics:read
```

Paste it into the connect form on `/`. In V1 the key is held in memory for the duration
of a request or job. It is never written to the database in plaintext and never logged.

## Klaviyo API notes

The adapter is pinned to revision **2026-07-15**, set in one place
(`packages/klaviyo/src/config.ts`). Every endpoint, filter, scope and rate limit was
verified against Klaviyo's published OpenAPI spec (`github.com/klaviyo/openapi`), which
carries `x-klaviyo-scopes` and `x-klaviyo-ratelimit` per operation.

Three constraints shape the design and are worth knowing before changing anything:

1. **Reporting is capped at 2 requests per minute and 225 per day.** An audit therefore
   makes exactly two report calls — one `campaign-values-report` and one
   `flow-values-report` — each grouped by message ID, rather than one call per message.
   Do not reintroduce per-message reporting.
2. **`GET /api/campaigns` requires a `filter`**, and it must pin
   `messages.channel = email`. There is no `send_time` filter; the date range filters on
   `scheduled_at` and the exact send time is post-filtered from the response attribute.
3. **Klaviyo cannot render a template "as a profile".** `POST /api/template-render` takes
   a free-form `context` object that the caller constructs. Building that context from a
   profile, and mocking trigger-event data for flows, is this application's job. Mocked
   context is always flagged as mocked, never presented as real.

Revisions `2026-04-15.pre` and `2026-07-15.pre` introduce an omni-channel campaign model
with GA targeted at 2026-10-15. All campaign shape knowledge lives in `packages/klaviyo`
so that migration stays contained.

## Verification

`pnpm test` covers response parsing, cursor pagination, filter construction, rate-limit
buckets, credential redaction and account normalization.

Phase 1's live check must be run on a machine with network access to `a.klaviyo.com`:
start the app, paste a real key, and confirm the connect panel shows the correct company
name, timezone and currency.

## Security

- API keys are never persisted in plaintext, never logged, and never returned in a
  response body. `packages/klaviyo/src/redact.ts` scrubs every error before it escapes.
- Errors carry a safe operator message and a separate redacted developer payload.
- Email content is treated as confidential and is not sent to any third-party AI API.
- Screenshot storage is private; the Figma plugin reads through an application endpoint
  that mints short-lived signed URLs rather than exposing the bucket.
