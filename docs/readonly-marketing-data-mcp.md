# Read-only Klaviyo and Meta data for Claude: setup and build spec

Purpose: give Claude read-only access to Klaviyo and Meta Ads data across several
brands, through one small local MCP server, so analysis can be done in conversation
without exporting CSVs by hand.

How to use this document: paste it (or point a Claude Code session at it) and ask
Claude to "build the server described here, then walk me through Parts 1 and 2 for the
first brand". Parts 1 and 2 are things only a human can do in the Klaviyo and Meta
admin screens. Part 3 onward is the build.

Build this fresh. Do not carry over credentials, exports, code or client material from
any previous engagement.

---

## 0. Before you start

1. Get explicit sign-off from whoever owns data and security at the company that the
   brand data can be processed by Claude. Check which Claude plan the work account is on
   and what its data retention and training terms are. Klaviyo profile data is personal
   data. Do this before creating any credentials.
2. Decide the default scope. Recommended: aggregate performance data only (campaigns,
   flows, ads, spend, revenue, conversion). Leave individual profile and event access
   switched off unless there is a specific need.
3. Pick short profile names, one per brand, for example `brand-a`, `brand-b`. These are
   used in every tool call and every env var name below.

---

## 1. Klaviyo: create a read-only key (per brand, about 5 minutes)

A Klaviyo private key belongs to exactly one Klaviyo account, so you need one key per
brand.

1. Log in to the brand's Klaviyo account as a user who can manage API keys.
2. Go to **Settings, then API keys, then Create private API key**.
3. Name it something traceable, for example `claude-readonly-<yourname>-<yyyy-mm>`.
4. Choose **Custom key** and set every scope to **No access** except the following
   **Read** scopes:

   | Scope | Why |
   |---|---|
   | `accounts:read` | Account name, timezone, currency. Also used to validate the key |
   | `campaigns:read` | Campaign list and message details |
   | `flows:read` | Flow list, actions and messages |
   | `templates:read` | Email template HTML, for content review |
   | `metrics:read` | Metric IDs and the reporting endpoints |
   | `lists:read`, `segments:read` | Audience sizes and definitions |
   | `profiles:read` (optional) | Leave off by default. Personal data |
   | `events:read` (optional) | Leave off by default. Personal data |

   Klaviyo also offers a preset "Read-only key". It is broader than this list, so prefer
   the custom key.
5. Copy the key (starts `pk_`). It is shown once. Store it straight into the secret
   store described in Part 4. Do not paste it into chat, email or a document.
6. Note the brand's **placed order metric ID** (Klaviyo, Analytics, Metrics, select
   "Placed Order", the ID is in the URL). The reporting endpoints need a conversion
   metric. The server can also look this up, see tool `klaviyo_list_metrics`.

Rotation: set a calendar reminder for 90 days. Revoke the key in the same screen when
the engagement with that brand ends.

### Klaviyo API facts the build must respect

These were verified against Klaviyo's public OpenAPI spec (`github.com/klaviyo/openapi`),
which lists `x-klaviyo-scopes` and `x-klaviyo-ratelimit` per operation. Re-check them at
build time, they change.

- Base URL `https://a.klaviyo.com`. Headers on every request:
  `Authorization: Klaviyo-API-Key <key>`, `revision: <YYYY-MM-DD>`,
  `Accept: application/vnd.api+json`.
- Pin the revision in exactly one constant. Use the latest stable (non `.pre`) revision
  at build time. Campaign models changed between 2026 revisions (an omni-channel model
  with audiences, messages and variations), so confirm which shape the pinned revision
  returns and keep all shape knowledge in one module.
- Responses are JSON:API. Pagination is cursor based: follow `links.next`, which carries
  `page[cursor]`. Never construct cursors yourself.
- `GET /api/campaigns` requires a `filter`, and it must include
  `equals(messages.channel,'email')` (or the channel wanted). There is no send time
  filter, so filter on `scheduled_at` and post-filter the exact send time client side.
- Reporting endpoints (`campaign-values-report`, `flow-values-report` and the series
  variants) are `POST` but are read operations. They are very tightly rate limited
  (at last check 2 per minute and 225 per day per account). Design for this: one call
  grouped by message ID rather than one call per message, cache results, and surface
  the limit to Claude as a clear message instead of retrying in a loop.
- Klaviyo cannot render a template "as a profile". `POST /api/template-render` takes a
  context object you build. Treat any mocked context as mocked and say so in output.

---

## 2. Meta: create a read-only token (per business, about 20 minutes)

Use a System User token. It is not tied to a person's login, so it survives staff
changes, and it can be limited to specific ad accounts with view-only permission.

Prerequisites: the company has a Meta Business portfolio (Business Manager) and you are
a business admin, and the brand ad accounts sit inside it (owned, or shared to it).

1. **App.** Go to `developers.facebook.com`, create an app, choose the Business type,
   and attach it to the company's Business portfolio. One app can serve all brands in
   that portfolio. Note the App ID and App Secret.
2. **System user.** In Business Settings, go to Users, then System users, then Add.
   Name it `claude-readonly`. Role: **Employee** (not Admin).
3. **Assign assets.** Select the system user, then Add assets, then Ad accounts. Select
   each brand's ad account and grant **View performance** only. Do not grant Manage ad
   account, Create ads or any other task. Repeat for every brand.
4. **Generate the token.** On the system user, click Generate new token, select the app,
   choose the longest expiry the screen offers, and tick only **`ads_read`**.
   Do not tick `ads_management`. Copy the token immediately, it is shown once.
5. **Optional, organic data.** Page and Instagram insights need extra permissions
   (`pages_read_engagement`, `read_insights`, `instagram_basic`,
   `instagram_manage_insights`) and the matching Page and Instagram assets assigned to
   the system user. Add these only if organic reporting is in scope.
6. **Collect IDs.** For each brand note the ad account ID (Business Settings, Accounts,
   Ad accounts). The API form is `act_<number>`.
7. **Secret proof (recommended).** In the app's Advanced settings, turn on "Require App
   Secret". The server then sends `appsecret_proof`, an HMAC-SHA256 of the token keyed
   with the app secret, so a leaked token alone is not enough.
8. **Smoke test** (replace values, run on your own machine, never paste the token into
   chat):

   ```bash
   curl -sS -G "https://graph.facebook.com/<VERSION>/me/adaccounts" \
     -H "Authorization: Bearer $META_TOKEN" \
     --data-urlencode "fields=id,name,currency,timezone_name,account_status"
   ```

   You should see exactly the ad accounts assigned in step 3 and no others.

Whether a standard-access `ads_read` token is enough without App Review depends on
whether the ad accounts belong to your own business or to other businesses. For the
company's own brands it normally works without review. If a client-owned account is ever
added, check the current Meta requirements for Advanced Access before assuming it works.

### Meta API facts the build must respect

- Pin one Graph API version in one constant. Use the newest version listed on Meta's
  changelog at build time and review it every quarter, old versions are retired.
- Send the token in the `Authorization: Bearer` header, never in the query string, so it
  stays out of logs and error messages.
- Ad account IDs need the `act_` prefix. Spend is returned in the account's currency and
  dates follow the account's timezone. Return both alongside every insights result.
- Insights come from `GET /act_<id>/insights`. Useful parameters: `level`
  (account, campaign, adset, ad), `fields`, `time_range` or `date_preset`,
  `time_increment`, `breakdowns`, `action_attribution_windows`, `filtering`, `limit`.
- Attribution windows change numbers. Always return the window used and never mix
  windows within one comparison.
- Large queries time out. Do not use the asynchronous insights job (it is a `POST`).
  Instead split by date range and level and page with the `paging.cursors.after` value.
- Read rate-limit headers (`x-business-use-case-usage`, `x-app-usage`) and back off when
  usage nears the limit.

---

## 3. The MCP server: what to build

Recommended stack: TypeScript on Node 22, the official `@modelcontextprotocol/sdk`,
`zod` for input and response validation, `vitest` for tests, stdio transport. Python with
the official MCP SDK is fine if that is the house language.

### 3.1 Read-only is enforced in four places

1. The credential itself (scopes in Part 1, View performance and `ads_read` in Part 2).
2. An allowlist inside the HTTP layer. Do not filter by "GET only", because Klaviyo's
   reporting and render endpoints are `POST`. List the permitted `method + path pattern`
   pairs explicitly and reject everything else before a request is made.
   Include a test that proves a `DELETE`, a `PATCH`, and a `POST` to a non-listed path
   are all refused.
3. No write tools exist. There is no generic "call any endpoint" tool.
4. Redaction. Strip the key and token from every error, log line and tool result.

### 3.2 Profiles

One config file outside the repo, for example `~/.config/marketing-mcp/profiles.json`:

```json
{
  "brand-a": {
    "klaviyo": { "keyRef": "KLAVIYO_KEY_BRAND_A", "conversionMetricId": "ABC123" },
    "meta": { "adAccountId": "act_1234567890", "tokenRef": "META_TOKEN_MAIN",
              "appSecretRef": "META_APP_SECRET_MAIN" }
  },
  "brand-b": {
    "klaviyo": { "keyRef": "KLAVIYO_KEY_BRAND_B" },
    "meta": { "adAccountId": "act_0987654321", "tokenRef": "META_TOKEN_MAIN",
              "appSecretRef": "META_APP_SECRET_MAIN" }
  }
}
```

The file holds names of secrets, never the secrets. Rules:

- Every tool takes a required `profile` argument. No default profile, so Claude can
  never silently query the wrong brand.
- Every result echoes the profile name, account name, currency and timezone.
- Never combine data from two profiles in one tool call. Cross-brand comparison is done
  by Claude calling the tool once per brand.
- A tool for `list_profiles` returns names only, never refs or values.

### 3.3 Tools (first version)

Klaviyo:

| Tool | Endpoint(s) | Notes |
|---|---|---|
| `klaviyo_get_account` | `GET /api/accounts` | Doubles as key validation |
| `klaviyo_list_metrics` | `GET /api/metrics` | To find the conversion metric |
| `klaviyo_list_campaigns` | `GET /api/campaigns` | Required channel filter, date range, paginated |
| `klaviyo_list_flows` | `GET /api/flows` | Status, trigger type, last updated |
| `klaviyo_get_flow` | `GET /api/flows/{id}` with actions and messages | |
| `klaviyo_campaign_report` | `POST /api/campaign-values-report` | Grouped by message, cached, rate limit aware |
| `klaviyo_flow_report` | `POST /api/flow-values-report` | Same |
| `klaviyo_list_segments`, `klaviyo_list_lists` | `GET` | Name and size only |
| `klaviyo_get_template` | `GET /api/templates/{id}` | Returns HTML, truncate by default |

Meta:

| Tool | Endpoint(s) | Notes |
|---|---|---|
| `meta_get_ad_account` | `GET /act_<id>` | Name, currency, timezone, status |
| `meta_list_campaigns`, `meta_list_adsets`, `meta_list_ads` | `GET /act_<id>/...` | Status, objective, budget, paginated |
| `meta_get_insights` | `GET /act_<id>/insights` | Level, date range, breakdowns, attribution window |
| `meta_list_creatives` | `GET /act_<id>/adcreatives` | Copy, headline, CTA, thumbnail URL |

Cross-cutting:

| Tool | Purpose |
|---|---|
| `list_profiles` | Profile names only |
| `export_to_file` (or a `saveTo` option on the heavy tools) | Writes large results to a local CSV or JSON and returns the path and a short summary, so thousands of rows do not flood the conversation |

### 3.4 Behaviour requirements

- Cap response size. Default 50 rows inline, a clear "N more rows, use export" message
  beyond that.
- Return compact JSON with stable field names, not raw API payloads.
- Every result includes: profile, source (Klaviyo or Meta), API revision or version,
  date range, timezone, currency, attribution window (Meta), and fetched-at time.
- Clear errors that tell Claude what to do next: "403: key is missing `flows:read`",
  "rate limited, retry after 60s, 3 of 225 daily reporting calls remain".
- Klaviyo rate limiter with per-class buckets, honouring `Retry-After`. Meta backoff
  based on usage headers.
- Short in-memory cache keyed on profile, endpoint and parameters (5 to 15 minutes), so
  repeated questions do not burn the reporting quota.
- Timeouts on every request, bounded retries on 429 and 5xx only, never on 4xx.
- Personal data off by default. If `profiles:read` or `events:read` tools are added
  later, put them behind a per-profile `allowPersonalData: true` flag, and return hashed
  or masked emails unless explicitly asked.

### 3.5 Tests that must exist before first use

- Allowlist refuses every non-listed method and path.
- Redaction removes the key and token from thrown errors and logged output.
- Pagination follows cursors and stops at the requested limit.
- Rate limiter respects `Retry-After` and the reporting daily cap.
- Profile resolution fails loudly on an unknown profile and on a missing secret.
- A live check per brand: `klaviyo_get_account` and `meta_get_ad_account` return the
  expected account name, currency and timezone.

---

## 4. Where secrets live and how Claude connects

Secrets, in order of preference:

1. OS keychain (macOS Keychain, Windows Credential Manager, or `libsecret`) read by the
   server at start up.
2. A password manager CLI (for example 1Password `op run`) that injects env vars when the
   server launches.
3. A `.env` file outside any git repo with permissions `600`. Add it to a global
   gitignore as a second line of defence.

Never place secrets in the MCP client config JSON, in the repo, in chat, or in a shared
document.

Registering the server (stdio):

```bash
# Claude Code
claude mcp add marketing-data --scope user -- node /path/to/marketing-mcp/dist/index.js

# Claude Desktop: add to claude_desktop_config.json
# { "mcpServers": { "marketing-data": { "command": "node",
#     "args": ["/path/to/marketing-mcp/dist/index.js"] } } }
```

Keep the server's code in a private repo with a secret scanning check (for example
`gitleaks` as a pre-commit hook).

---

## 5. Onboarding checklist for each new brand

- [ ] Sign-off from the brand or business owner to access and analyse the data
- [ ] Klaviyo custom key created with the Part 1 scopes only, stored in the secret store
- [ ] Placed order metric ID noted
- [ ] Ad account assigned to the Meta system user with View performance only
- [ ] Ad account ID added to `profiles.json`
- [ ] `klaviyo_get_account` and `meta_get_ad_account` return the right name, currency
      and timezone
- [ ] Rotation reminder set for 90 days
- [ ] Offboarding note: who revokes the key and the asset assignment, and when

---

## 6. Useful first questions to ask Claude once it is connected

- "For `brand-a`, list the last 90 days of email campaigns with revenue per recipient,
  ranked, and flag the bottom five."
- "Compare flow revenue against campaign revenue for `brand-a` this quarter."
- "For `brand-a`, show Meta spend, ROAS and CPA by campaign for the last 30 days at a
  7 day click and 1 day view window, and say which numbers you would not trust."
- "Which Meta creatives have the highest spend with the lowest conversion volume?"

## 7. Known limits to tell stakeholders

- Klaviyo reporting is rate limited hard, so very wide historical pulls take days of
  quota or need a data warehouse export instead.
- Meta and Klaviyo attribute revenue differently and will not reconcile. Report both and
  label the attribution rules.
- Meta retains granular breakdown data for a limited period. Archive monthly if long
  history matters.
- This is read-only by design. Anything that changes an account (pausing ads, editing
  flows) is out of scope and should not be added to this server.
