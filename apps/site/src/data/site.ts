/**
 * Site settings. Everything you are likely to change before or after launch lives here.
 * `pnpm preflight` reads this file and tells you what is still open.
 */
export const site = {
  name: 'HD Growth Advisory',
  person: 'Hugh Duffie',
  url: 'https://hughduffie.com',
  description:
    'Growth advice and coaching for founders of consumer brands, from an advisor who still works in one every day.',
  social: {
    linkedin: 'https://www.linkedin.com/in/hughduffie',
    instagram: 'https://instagram.com/hughduffie',
  },

  /** Shown on Get in touch, the Advisory FAQ and the confirmation screen. */
  replyTime: '2 working days',

  /** Advisory page offers. Set `price` to null to show "Price on request". */
  offers: {
    advisory: { price: '£1,250', terms: 'a month, minimum 3 months' },
    sprint: { price: null as string | null, terms: 'one-off' },
  },

  /**
   * Klaviyo. These are public identifiers, not secrets, so they are safe to commit.
   * Find them in Klaviyo: Settings > Account > API keys (Public API key / Site ID),
   * and Audience > Lists and segments > your master list > Settings (List ID).
   */
  klaviyo: {
    companyId: 'VeKT6B',
    /**
     * One master list. Everyone who gives marketing consent joins it, and segments do the rest.
     * Segments are built in Klaviyo from the events below (see LAUNCH.md, step 2).
     */
    listId: '',
    /** Metric names the site sends. Build the flows on these in Klaviyo. */
    metrics: {
      resourceRequested: 'Requested resource',
      loomSubmitted: 'Submitted Loom intake',
      valuesReport: 'Requested values report',
    },
    revision: '2026-07-15',
  },

  /** Optional analytics. Leave empty for none. The cookie banner only appears when one is set. */
  analytics: {
    ga4: '', // for example G-XXXXXXXXXX
  },

  /** Legal pages. Add a contact address before launch. */
  legal: {
    contactEmail: '',
    lastUpdated: '14 November 2026',
  },
} as const;

export const nav = [
  { label: 'Home', href: '/', key: 'home' },
  { label: 'Advisory', href: '/advisory', key: 'advisory' },
  { label: 'Resources', href: '/resources', key: 'resources' },
  { label: 'About', href: '/about', key: 'about' },
] as const;

export type NavKey = (typeof nav)[number]['key'] | 'none';

/** Brand logos on the home page. Height is the display height in px at desktop. */
export const brandLogos = [
  { name: 'Mother Root', file: 'mother-root' },
  { name: 'Sandows', file: 'sandows' },
  { name: 'Days Brewing Co', file: 'days' },
  { name: 'Cowshed', file: 'cowshed' },
  { name: 'Elliotts', file: 'elliotts' },
] as const;

export const brandsWorkedOn = [
  'Azhara Grove', 'Black Lines', 'Blueprint', 'Cowshed', 'Crispin', 'DAME', 'Days Brewing Co',
  'Dr Sting’s Hot Honey', 'Elliotts', 'Evermore', 'Forza Wine', 'Infinite Session', 'Kombucha Kat',
  'Kyoot', 'Mother Root', 'neat. clean', 'Nettle', 'Oat Cult', 'Oranj', 'Perky Blenders', 'Quarter',
  'Rapport London', 'Real Kombucha', 'Sandows', 'Sunrise Beverages', 'Surreal', 'Tarla',
  'The Ethical Butcher', 'Veuve Clicquot', 'Viva Voce', 'WatchHouse', 'Wednesday’s Domaine', 'Wildfarmed',
];
