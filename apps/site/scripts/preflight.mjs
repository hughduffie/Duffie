#!/usr/bin/env node
/**
 * Launch check. Run `pnpm preflight` from apps/site.
 * Reads the settings and content files and lists what is still open.
 * Exits with 1 if anything would break the live site, 0 otherwise.
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const siteTs = read('src/data/site.ts');
const testimonials = read('src/data/testimonials.ts');
const wrangler = read('wrangler.jsonc');

const blockers = [];
const decisions = [];
const done = [];

const value = (key) => {
  const m = siteTs.match(new RegExp(`${key}:\\s*(?:'([^']*)'|(null))`));
  return m ? (m[1] ?? null) : undefined;
};
const check = (ok, list, pass, fail) => (ok ? done.push(pass) : list.push(fail));

// Forms
check(value('companyId'), blockers, 'Klaviyo company ID is set.', 'Klaviyo company ID is empty (src/data/site.ts, klaviyo.companyId). Every form will fail until it is set.');
check(value('listId'), blockers, 'Klaviyo master list ID is set.', 'Klaviyo master list ID is empty (src/data/site.ts, klaviyo.listId). Sign-ups will be dropped until it is set.');

// Content decisions
if (value('price') !== undefined && /sprint:\s*\{\s*price:\s*null/.test(siteTs)) {
  decisions.push('Sprint has no price, so the Advisory page says "Price on request" (offers.sprint.price).');
} else done.push('Sprint price is set.');

const placeholders = (testimonials.match(/placeholder:\s*true\s*\}/g) ?? []).length;
const real = (testimonials.match(/^\s*quote:\s*$|^\s*\{ quote:/gm) ?? []).length - placeholders;
if (real === 0) decisions.push(`No real testimonials yet. The home page shows the brand logos only (${placeholders} placeholders are hidden). Edit src/data/testimonials.ts.`);
else done.push(`${real} testimonial(s) will show on the home page.`);

check(value('contactEmail'), decisions, 'Legal contact email is set.', 'Legal pages have no contact email, so they point to Get in touch (legal.contactEmail).');
decisions.push(`Reply time is shown as "${value('replyTime')}" on Get in touch and Advisory. Confirm it (replyTime).`);
decisions.push('About uses the portrait labelled "Portrait placeholder" in Figma. Swap src/assets/textures/about-2.jpg if you have a better one.');
decisions.push('About lists four values (humility, integrity, tenacity, enjoyment). Confirm you are happy to publish them.');
decisions.push('Three Advisory FAQ answers and the Privacy, Terms and Cookies pages are drafts. Read them once before launch.');

check(value('ga4'), decisions, 'Analytics ID is set. The cookie banner will show.', 'No analytics ID, so no analytics and no cookie banner (analytics.ga4). Fine to launch like this.');

// Domain
const routesLive = /^\s*"routes"\s*:/m.test(wrangler);
check(routesLive, decisions, 'Custom domain route is on in wrangler.jsonc.', 'Custom domain is still commented out in wrangler.jsonc. Until then the site deploys to the workers.dev address only (LAUNCH.md, step 5).');

check(existsSync(join(root, 'public/og.jpg')), decisions, 'Share image is present.', 'public/og.jpg is missing, so links will share without an image.');

const line = (s) => console.log(s);
line('\nhughduffie.com launch check\n');
if (blockers.length) {
  line('MUST FIX BEFORE LAUNCH');
  blockers.forEach((b) => line('  x ' + b));
  line('');
}
line('TO DECIDE OR CONFIRM');
decisions.forEach((d) => line('  ? ' + d));
line('\nREADY');
done.forEach((d) => line('  - ' + d));
line(blockers.length ? `\n${blockers.length} thing(s) to fix. See LAUNCH.md.\n` : '\nNothing blocking. Follow LAUNCH.md to publish.\n');
process.exit(blockers.length ? 1 : 0);
