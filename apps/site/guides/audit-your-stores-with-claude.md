# Audit your own stores with Claude, no apps needed

Script for the guide. Same format as the other outlines: one block per slide, then an appendix with the full deck prompt.

- **Who it is for:** founders and operators running two or more Shopify stores that are not on Plus, with Meta ads
  and Klaviyo on each.
- **The promise:** read-only access to Meta, Shopify and Klaviyo for every store, in one folder, so Claude can pull
  the numbers and write the audit. No monthly app subscriptions.
- **The method:** three read-only connections per store, set up once. Then two prompts: one runs the audit, one turns
  it into a current-state deck with a RICE-ranked 90-day roadmap, modelled on the Viva Voce review and the Sunrise
  plan.
- **Facts checked on 18 November 2026** against Meta, Shopify and Klaviyo developer docs. These platforms change often.
  Re-check the Shopify slides before publishing (see slide 10).
- Text in [square brackets] is for you to check or fill in before it goes out.
- **Cover illustration:** dot-matrix bar chart of five stores, with the shortest bar in the accent colour (Blue deck
  palette). Built to the prompt in `HD-Advisory/brand/illustration-style.md`.
- **Status:** built as a Figma Slides deck on 18 November 2026 (26 slides, including a two-slide appendix with the full
  deck prompt): https://www.figma.com/slides/fGQIwmJUI8WmI3dwrLDSmw. The deck is now the source of truth. Its order
  differs slightly from this outline where a layout suited the content better. Not yet in `src/data/resources.ts`
  (add it when the guide is ready to publish, plus a branch in the Klaviyo "Requested resource" flow).
---

**1. Cover**
Free guide for founders and operators
**Audit your own stores with Claude, no apps needed**
Read-only access to Meta, Shopify and Klaviyo, then one prompt for the audit and one for the 90-day plan.

**2. Where this starts**
**Most audits sit behind an app subscription.**
Each store pays for a reporting tool, an email analytics tool and an ads dashboard. Each one shows its own slice. None
of them tells you what to do first. With two or three stores, that is a lot of logins and a lot of monthly fees for
numbers you could pull yourself.

**3. What changes**
**The platforms already give you the data. Claude can read it.**
Meta, Shopify and Klaviyo all have APIs. You give Claude Code a read-only key for each one, per store. It pulls the
data, works out the numbers and writes the findings. You review it and decide.

**4. What you will have**
**One folder that can audit every store**
- A read-only Meta token that sees every ad account in your Business portfolio.
- A read-only Shopify app on each store.
- A read-only Klaviyo key for each account.
- An audit prompt that compares stores side by side.
- A deck prompt that turns the audit into a current-state review and a RICE-ranked 90-day roadmap.
[Time it on your own stores before claiming a setup time. Budget an afternoon for the first store, less for each one after.]

**5. How it fits together**
| Platform | What you create | What Claude reads |
|---|---|---|
| Meta | One app and one system user, for the whole portfolio | Spend, purchases, ROAS, frequency, hook and hold rates, by ad |
| Shopify | One custom app per store | Orders, products, discounts, returning customers |
| Klaviyo | One private key per account | Flows, campaigns, list growth, revenue per recipient |
All three are read only. Nothing Claude does can change a campaign, an order or an email.

**6. Before you start**
**What you need**
- Admin access to your Meta Business portfolio and each ad account.
- A Shopify Partner account (free) and owner or staff access to each store.
- Owner, Admin or Manager access to each Klaviyo account.
- A Claude plan that includes Claude Code. Run it on your own computer for this, not in the cloud (slide 10 explains why).
- An empty folder, for example `store-audits`.

---

**7. Meta, step 1: create the app**
**One app for the whole portfolio**
1. Go to developers.facebook.com and register as a developer if you have not already.
2. Create an app. Choose the use case for creating and managing ads with the Marketing API. [Check the current
   use-case label in the wizard.]
3. Connect it to your Business portfolio when asked.
4. Leave it in development. You are only reading your own ad accounts, so you do not need App Review.

**8. Meta, step 2: a system user and a token**
**A login that belongs to the business, not to you**
1. Business Settings, Users, System users, Add. Give it the Employee role.
2. Assign assets: add each ad account with view-only (performance) access.
3. Assign the app to the system user.
4. Generate token: pick the app, tick `ads_read` and `read_insights` only, and set it not to expire.
5. Copy the token once and store it in your `.env` file (slide 15). Meta will not show it again.
Why a system user: it does not break when someone leaves, changes their password or loses access.

**9. Meta, step 3: check it works**
**Ask Claude:**
> Using META_TOKEN in .env, list every ad account this token can see, with its name, currency and time zone.
> Then pull last 30 days of spend and purchases for each. Do not change anything.
If it lists your accounts, you are connected. New apps get limited API access, which is plenty for an audit. Large pulls
may be rate limited, so ask Claude to pull by week rather than by day if it hits limits.

---

**10. Shopify: what changed in 2026**
**There is no token to copy any more.**
- New custom apps can no longer be made in the Shopify admin. They are made in the Dev Dashboard instead.
- On a store that is not on Plus, a custom app installs on that one store only. So you make one app per store.
- From 20 November 2026, a custom app needs an IP allowlist before it can be installed on a store outside your own
  organisation. From 1 January 2027, existing installs need one too. This is why you run Claude Code on your own
  computer: add your office or home IP to the allowlist. [Check how the allowlist handles changing home IPs.]
- If the stores sit in your own Shopify organisation, there is a simpler route: no install link, and a token from the
  client credentials grant that lasts 24 hours. Claude can refresh it each run.

**11. Shopify, step 1: one app per store**
**In the Dev Dashboard, from your Partner organisation**
1. Apps, Create app, Start from Dev Dashboard. Name it after the store, for example "Audit: Store A".
2. On the version: set the App URL (the default is fine, it is not an embedded app), choose the latest API version and
   add read-only scopes:
   `read_orders`, `read_all_orders`, `read_products`, `read_customers`, `read_discounts`, `read_inventory`, `read_reports`
3. Release the version.
4. Settings, Access requests: request "Read all orders" (otherwise you only see the last 60 days) and protected
   customer data, so customer fields are not blank. [Check whether custom-distribution apps get these without review.]
5. Distribution: choose Custom distribution, enter the store's myshopify domain and generate the install link.
   This choice cannot be changed later.

**12. Shopify, step 2: install and get the token**
**Claude writes the small bit of code this needs**
1. Open the install link while signed in to the store, and approve.
2. Shopify sends a one-time code to your redirect URL. Exchange it for an offline token with the client ID and secret.
3. Ask Claude:
> Write a small local script that handles the Shopify OAuth callback on localhost for my custom app, exchanges the code
> for an offline access token, and saves it to .env as SHOPIFY_TOKEN_<STORE>. Use expiring tokens with a refresh
> token, and refresh automatically before each run. Explain each step before you run it.
4. Repeat for each store. Same steps, new app, new link.

**13. Shopify, step 3: check it works**
**Ask Claude:**
> For each store in stores.yaml, call the Shopify Admin GraphQL API with its token. Return shop name, plan, currency,
> order count for the last 90 days and the date of the oldest order you can see. Do not change anything.
If the oldest order is only 60 days ago, "Read all orders" has not been approved yet.

---

**14. Klaviyo: a read-only key per account**
**The quickest of the three**
1. In each Klaviyo account: Settings, API keys, Create private API key.
2. Choose custom scopes. Set read access only:
   `accounts`, `campaigns`, `flows`, `lists`, `segments`, `metrics`, `profiles`, `templates`, `events`
3. Copy the key into `.env` as `KLAVIYO_KEY_<STORE>`.
Klaviyo also has its own MCP server. Run it locally with the same key and `READ_ONLY` set to true, one entry per
account. Claude Code can also call the API directly with the key. Either works. The local MCP server needs `uv`
installed. [Check the current Klaviyo MCP setup page before publishing.]
One thing to know: Klaviyo's reporting endpoints allow 2 requests a minute and 225 a day. Ask Claude for one campaign
report and one flow report per account, grouped by message, not one call per email.

**15. Put it together**
**One folder, one file of keys, one file of stores**
```
store-audits/
  .env            keys and tokens, never shared, never committed
  .gitignore      contains .env and data/
  stores.yaml     each store: name, myshopify domain, Meta ad account ID, Klaviyo key name, currency
  CLAUDE.md       the rules: read only, never write, cite every number, say when data is missing
  data/           raw pulls, one folder per store and date
  audits/         the written audits and decks
```
Put the rules in CLAUDE.md so they apply to every run: read only, no customer names or emails in outputs, and every
figure traced to the pull it came from.

---

**16. Run the audit**
**Prompt 1: the audit**
> Using stores.yaml and .env, pull the last 90 days for every store from Meta, Shopify and Klaviyo, read only. Save the
> raw data in data/<store>/<date>/. Then write one audit per store and a one-page comparison across stores. For each
> finding give the number, the benchmark, what it means and the source file. Flag anything you could not pull.
> Ask me before you assume anything about margin.

**17. What the audit checks**
| Area | Numbers | Healthy range to start from |
|---|---|---|
| Paid media | ROAS, cost per purchase vs average order value, frequency, hook rate, hold rate, CTR, spend per ad | Hook 30 to 40%, hold above 50%, CTR above 1%, retargeting frequency under 4 |
| Site | Conversion rate, revenue per session, checkout completion, bounce rate | Conversion above 2.5%, bounce under 35% |
| Commercial | Discounted share of orders, discounts as a share of revenue, gross margin | Discounts under 10% of net revenue |
| Email | Revenue share from email, welcome, post-purchase and winback flows, list health | Email 20%+ of revenue for most brands [check] |
| Retention | Returning customer rate, time to second order | Varies by category. Set your own baseline |
These are starting benchmarks from my own work, not rules. Change them for your category.

**18. Turn it into a plan**
**Prompt 2: the deck**
The full prompt is in the appendix. It asks for a current-state review and a 90-day roadmap ranked by RICE, with a
full page on each key initiative. It is built on the structure of real audits I have run for D2C brands.

**19. RICE in one slide**
**Reach x Impact x Confidence, divided by Effort**
| | What it means | Scale |
|---|---|---|
| Reach | How many customers or sessions it touches in 90 days | A number |
| Impact | How much it moves the metric for each one | 3 huge, 2 high, 1 medium, 0.5 low, 0.25 minimal |
| Confidence | How sure you are, given the data | 100%, 80%, 50% |
| Effort | Person-weeks to ship | A number |
The scores are estimates to challenge, not answers. Their value is in the argument they start.

**20. What a page per initiative looks like**
**Enough detail that someone else could run it**
- The problem, with the number behind it.
- The hypothesis: "We believe [change] will [result] because [insight]. We will know if [metric] reaches [target]."
- Actions with an owner and a "done when".
- Measures: baseline and 90-day target.
- Risks, dependencies and the decisions needed from you.

**21. Be honest**
**What to watch out for**
- Claude can misread an API field. Spot-check three numbers per store against the platform's own dashboard.
- Attribution differs between Meta, Shopify and Klaviyo. The audit should say which source each number uses.
- Keys are passwords. Keep `.env` out of shared drives, chats and repos. Revoke any key you stop using.
- Customer data stays in your folder. Ask for totals and segments, not names and emails.
- Platform rules change. If a step here no longer matches the screen, check the platform's developer docs.

**22. Start small**
**Connect one store this week.**
Run the audit on it, check the numbers by hand, then add the next. Next guide: Creative strategy, for founders. Or talk
it through at hughduffie.com.

---

## Appendix: the deck prompt

For slide 18. Paste into Claude Code in the `store-audits` folder after the audit has run. Replace the [brackets].

```
Build a deck for [STORE NAME] from the audit in audits/[store]/ and the raw data in
data/[store]/. Audience: [founder / CEO name]. It should read as a review from a senior
operator: plain, specific, no hype. Short sentences. No em-dashes.

STRUCTURE

1. Cover. A one-line verdict as the title, for example "Strong brand. Weak payback."
   Subtitle: "Review for [name], [month year]".

2. Big picture. Three numbers in large type, each with a one-line label and a
   comparison (benchmark or last period). Pick the three that explain most of the
   gap, for example return per $1 of ads, returning customer rate, share of revenue
   from email.

3. The journey. Four steps, in the order they should be fixed: Traffic, Conversion,
   Acquisition (sign-ups), Retention. One line on each.

4. One section per step (one or two slides each):
   - Title states the finding, not the topic ("Every sales ad costs more than an order
     is worth", not "Paid media").
   - A small table of the evidence (campaign, spend, cost per purchase, and so on).
   - A "So what?" line underneath: what it means in money or customers.
   - Three numbered actions at most.

5. KPIs and benchmarks. Two columns: what we measure, healthy range. Include
   conversion rate, revenue per session, bounce rate, discounts as a share of net
   revenue, hook rate, hold rate, CTR, blended CAC, MER, returning customer rate.
   Show the store's current figure next to each.

6. Priorities ranked by RICE. Title: "Priorities ranked by RICE". Label it
   "Estimates to challenge". Columns: #, Action, Reach, Impact, Confidence, Weeks,
   RICE score. 8 to 12 rows. Reach is customers or sessions touched in 90 days.
   Impact uses 3 / 2 / 1 / 0.5 / 0.25. Confidence 100% / 80% / 50%. Effort in
   person-weeks. Sort by score. Under the table, one line per assumption I should
   check.

7. Now, next, later. Three columns, no dates. Fill them from the RICE order, adjusted
   for dependencies. Weeks 1 to 4 under Now, 5 to 8 under Next, 9 to 13 under Later.

8. One full page for each key initiative (the top 3 to 5 by RICE, plus any that
   unblock others). Each page has:
   - Title: the initiative as an outcome.
   - Where it is today: a table with "What we see" and "What it means".
   - Hypothesis: "We believe [change] will [result] because [insight]. We will know
     this is true if [metric] reaches [threshold] against [baseline]."
   - Actions: a table with Action, Owner, Done when.
   - Measures: Baseline, 90-day target.
   - Risks and dependencies: three bullets at most.
   - Decisions needed from [name].

9. Who does what. A table: Area, what the founder owns, what the team or agency owns.

10. Key assumptions and sources. A table: Area, Assumption, Source. Every number in
    the deck traces back to a file in data/ or to something I told you.

11. Decisions needed and next steps this week.

RULES
- Every figure must come from the data or be labelled as an estimate.
- If data is missing (for example margin or cost of goods), say so on the slide
  and do not invent it.
- No more than about 40 words of body text per slide, except the initiative pages.
- Do not use customer names or emails anywhere in the deck.
- Use [brand deck template / Figma file link] for layout and type if I give one.
  Otherwise build it as a Google Slides deck [or: an HTML deck].
- Ask me up to five questions before you start if anything is unclear, especially
  margin, budget and who the owners are.
```
