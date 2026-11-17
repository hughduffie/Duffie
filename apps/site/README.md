# hughduffie.com

The HD Growth Advisory website. Built with Astro, hosted on Cloudflare. Design source: the Figma
"Template System" file, pages starting "Web /".

To publish, follow [LAUNCH.md](./LAUNCH.md).

## Run it

Needs Node 22+ and pnpm 10+.

```bash
pnpm install          # from the repo root or from apps/site
cd apps/site
pnpm dev              # http://localhost:4321, forms pretend to send so you can see every state
pnpm preflight        # what is left to do before launch
pnpm build            # production build into dist/
pnpm preview          # the production build, running as it will on Cloudflare
pnpm run deploy       # build and publish (after `npx wrangler login`)
```

## Where things are

| To change | Edit |
|---|---|
| Prices, reply time, Klaviyo IDs, analytics, social links | `src/data/site.ts` |
| Guides: titles, landing page copy, what is inside | `src/data/resources.ts` |
| Testimonials | `src/data/testimonials.ts` |
| Page copy | `src/pages/*.astro` (one file per page) |
| Colours, type scale, buttons, form styles | `src/styles/global.css` |
| Nav and footer | `src/components/Nav.astro`, `src/components/Footer.astro` |
| Redirects from old URLs | `public/_redirects` |
| The guides themselves | The Figma Slides decks. Outlines are in `guides/*.md` |

### Add a guide

Add an entry to `src/data/resources.ts`. That creates the card on Home and Resources and the gated page at
`/resources/<slug>`. Then add a branch for the new slug to the "Requested resource" flow in Klaviyo.

### Add a testimonial

Replace a placeholder in `src/data/testimonials.ts` and remove its `placeholder: true`. Placeholders show in
`pnpm dev` only. The published site hides them and shows the brand logos on their own until a real one exists.

## How it works

- Every page is static HTML. Two small endpoints run on Cloudflare: `/api/subscribe` (guides, Monthly notes,
  values report) and `/api/loom` (Get in touch). They pass the form to Klaviyo from the server, so ad
  blockers do not drop sign-ups.
- There are no secrets. Klaviyo's public company ID and one list ID are the only credentials, and they live in
  `src/data/site.ts`.
- Marketing sign-ups all join one master list. Segments are built in Klaviyo on the events the site sends.
- Until the list ID is set, the published site answers form posts with an error. `pnpm dev` always simulates success and sends nothing, unless
  you put `KLAVIYO_LIVE=1` in `apps/site/.env` to test against Klaviyo for real.
- The values exercise keeps answers in the browser (`localStorage`, key `hd-values-v1`). Nothing is sent
  unless the visitor asks for the report by email. Its logic is the published "Core Values Exercise"
  artifact, in `public/values/`, restyled by `src/styles/values.css`.
- Fonts (Neco, Satoshi, Array) are the Fontshare web files, self-hosted in `public/fonts/`, unconverted.
- The cookie banner only appears if `analytics.ga4` is set. Analytics loads only after "Accept all".

## Not built yet

- The resource gate modal and the "Before you go" Monthly notes popup from "Web / Popups and states". Guide
  cards link to the gated landing pages instead, which do the same job and can be shared.
- The email templates on "Web / Emails". Those are built in Klaviyo.
- Adding a Notion row for each Loom intake. The Klaviyo notification covers it for now.
