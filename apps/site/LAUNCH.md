# Publishing hughduffie.com

This replaces the current site on Namecheap with this one on Cloudflare. Steps 1 to 4 can be done any time
and change nothing on the live site. Step 5 is the switch. Allow about an hour in total.

Your domain registration can stay at Namecheap. Only the DNS and the hosting move.

## 1. Run the launch check

```bash
cd apps/site
pnpm install
pnpm preflight
```

It lists what must be fixed (the Klaviyo list ID) and what is still to confirm (Sprint price, testimonials,
reply time and so on). Everything it mentions is edited in `src/data/site.ts` or `src/data/testimonials.ts`.

## 2. Set up Klaviyo

Use your own HD Growth Advisory account, not a client account. No private API key is needed anywhere.

1. Create **one master list** (for example "HD Growth Advisory"). Copy its List ID (list > Settings) into
   `src/data/site.ts` as `klaviyo.listId`. The Public API key is already set.
2. Choose single or double opt-in on that list. It applies to every sign-up. Guides are sent by a flow on an
   event (below), so they arrive either way.
3. Build segments on the events the site sends:

   | Segment | Definition |
   |---|---|
   | Guide requesters | Has `Requested resource` at least once |
   | One guide | Has `Requested resource` at least once where `resource` equals the slug |
   | Values exercise | Has `Requested values report` at least once |
   | Loom leads | Has `Submitted Loom intake` at least once |
   | Monthly notes | Is in the master list (everyone who has given marketing consent) |

   Profiles also carry `signup_source` (`monthly-notes`, `guide:<slug>` or `values-exercise`), `last_resource`
   and `role`, if you want to segment on those.
4. Build the flows on the same events:

   | Event | Sent when | Use it to |
   |---|---|---|
   | `Requested resource` | Someone asks for a guide. Property `resource` is the slug. | Send the right guide (emails 1 to 4). Split on `resource`. |
   | `Requested values report` | Someone emails themselves the values report. | Send email 5. The top five, notes and themes are on the event and the profile. |
   | `Submitted Loom intake` | The Get in touch form is sent. | Send the confirmation (email 6) to the sender, and a notification to you with `brand`, `loom_link` and `revenue`. |

   The slugs are `brand-guidelines-in-figma`, `creative-strategy-for-founders` and `creator-marketing`.
5. Who joins the master list: guide requesters (they tick a consent box), Monthly notes sign-ups, and values
   report requesters who tick the Monthly notes box. Loom senders and values report requesters who leave the
   box unticked are not subscribed. They only receive the email they asked for.

## 3. Put the site on Cloudflare (no effect on the live site)

1. Create a free Cloudflare account.
2. Workers & Pages > Create > Import a repository > choose `hughduffie/Duffie`.
3. Set **Root directory** to `apps/site`, **Build command** to `pnpm build`, **Deploy command** to
   `npx wrangler deploy`, and the production branch to the branch this site is merged into.
4. Save. Cloudflare builds and gives you a `hughduffie-com.<your-name>.workers.dev` address. Check the site
   there. Every later push to that branch publishes automatically.

Prefer the command line? `npx wrangler login` once, then `pnpm run deploy` from `apps/site` does the same.

## 4. Move the DNS to Cloudflare

Do this carefully: your email (hd@hughduffie.com) runs on these records.

1. In Namecheap: Domain List > Manage > Advanced DNS. Screenshot every record.
2. In Cloudflare: Add a domain > `hughduffie.com` > Free plan. Cloudflare scans and imports the records.
3. Compare the import with your screenshot. Every **MX**, **SPF** (TXT starting `v=spf1`), **DKIM** and
   **DMARC** record must be there. Add any that are missing. Mail records should show "DNS only", not proxied.
4. Cloudflare shows two nameservers. In Namecheap: Domain List > Manage > Nameservers > Custom DNS, paste
   both, save.
5. Wait for Cloudflare to mark the domain Active (usually under an hour). The old site keeps working
   throughout, because the imported records still point at Namecheap hosting.
6. Send yourself a test email from another address to confirm mail still arrives.

## 5. Switch the domain to the new site

1. In Cloudflare DNS, delete the old `A` / `CNAME` records for `hughduffie.com` and `www` that point at
   Namecheap hosting. Leave every mail record alone.
2. In `wrangler.jsonc`, uncomment the `routes` line, then commit and push. Cloudflare attaches
   `hughduffie.com` to the site and issues the certificate.
3. For `www`: add a DNS record `www` > CNAME > `hughduffie.com` (proxied), then Rules > Redirect Rules >
   Create > use the "Redirect from WWW to root" template.
4. In Klaviyo, set up a sending domain and add the DKIM and tracking records it gives you to Cloudflare DNS.

## 6. Check it

- `https://hughduffie.com` and `https://www.hughduffie.com` both load the new site over HTTPS.
- Ask for a guide with your own address, join Monthly notes, and send a test Loom. Confirm each lands in
  Klaviyo and the emails arrive.
- Old links redirect: `/work.html` goes to About, `/e-comm.html` goes to Advisory (see `public/_redirects`).
- Email still sends and receives.

After a week without problems, cancel the Namecheap hosting plan. Keep the domain registration.

## Rolling back

Put the old `A` / `CNAME` records back in Cloudflare DNS (they are in your screenshot). The old site returns
within minutes. Nothing on Namecheap is deleted by any step above.
