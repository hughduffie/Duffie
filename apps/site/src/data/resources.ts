/**
 * The resource library. Add a guide by adding an entry here: it gets a card on /resources,
 * a card on the home page (the first three guides), and its own gated page at /resources/<slug>.
 *
 * `slug` is also sent to Klaviyo as the `resource` property, so the "Resource downloads" flow
 * can send the right guide.
 */
export type Illustration = 'terminal' | 'galaxy' | 'brief' | 'avatar' | 'funnel';
export type Category = 'Brand' | 'Creative' | 'Creators' | 'Exercises';

export interface Resource {
  slug: string;
  kind: 'guide' | 'exercise';
  category: Category;
  /** Small label on the card, for example "15 min read". */
  time: string;
  /** Card title. Keep it short: it sets in a 296px card. */
  title: string;
  illustration: Illustration;
  /** Landing page (guides only). */
  eyebrow?: string;
  headline?: string;
  intro?: string;
  inside?: string[];
  /** One line used in the form, meta description and emails. */
  summary: string;
}

export const coverColour: Record<Illustration, string> = {
  terminal: 'var(--blue-500)',
  galaxy: 'var(--lilac-200)',
  brief: 'var(--lime-200)',
  avatar: 'var(--blue-200)',
  funnel: 'var(--blue-500)',
};

export const resources: Resource[] = [
  {
    slug: 'brand-guidelines-in-figma',
    kind: 'guide',
    category: 'Brand',
    time: '30 min build',
    title: 'Proper brand guidelines in Figma, in 30 minutes',
    illustration: 'terminal',
    eyebrow: 'Free guide · 30 minutes to build',
    headline: 'Proper brand guidelines in Figma, in 30 minutes.',
    intro:
      'Most brand books sit in a PDF that the people making the emails and ads never open. This guide shows you how to turn yours into a working system in Figma, with colours, type and components set up as code, so the whole team makes work that looks like your brand. Consistency is what lets a small team move faster, and that is where the growth comes from.',
    inside: [
      'Why the brand book gets ignored, and what that costs you',
      'The three things designers use to scale consistency: a library, components and scripts',
      'Connecting Claude to Figma, with no coding background',
      'The two prompts that build your variables, styles and components',
      'Three real jobs to test it on: an email, an ad and a deck',
      'What to check with your designer before the team uses it',
    ],
    summary:
      'Turn your brand book into a working Figma system, built with code, so every email, ad and deck comes out on brand.',
  },
  {
    slug: 'creative-strategy-for-founders',
    kind: 'guide',
    category: 'Creative',
    time: '15 min read',
    title: 'Creative strategy, for founders',
    illustration: 'brief',
    eyebrow: 'Free guide · About 15 minutes',
    headline: 'Creative strategy, explained for founders.',
    intro:
      'Creative strategy is the most talked-about part of paid social right now. This is the plain version for founders: what it is, why changes inside Meta have made it the main lever in your ad account, and how to brief it well without becoming a creative director.',
    inside: [
      'What creative strategy is, in one page',
      'Why it is the priority now: after Meta’s Andromeda and GEM updates, the ad does the targeting',
      'What counts as a different ad, and what is the same ad again',
      'The five decisions in every ad: message, hook, angle, format, offer',
      'A worked example: one brief, three ads',
      'How to test ideas and read the results without living in Ads Manager',
      'A one-page brief you can hand to your team, a freelancer or an agency',
    ],
    summary:
      'What creative strategy is, why it has become the priority in paid social, and how to brief it as a founder.',
  },
  {
    slug: 'creator-marketing',
    kind: 'guide',
    category: 'Creators',
    time: '15 min read',
    title: 'Creator marketing for consumer brands',
    illustration: 'avatar',
    eyebrow: 'Free guide · About 15 minutes',
    headline: 'Creator marketing for consumer brands.',
    intro:
      'How to find creators your customers already trust, brief them without scripting them, pay them fairly and turn the best content into ads. Whitelisting is one tactic in here. The guide covers the whole job.',
    inside: [
      'Where creators fit in your growth plan, and when it is too early',
      'The ways to work with creators: gifting, paid content, ambassadors and affiliates',
      'Finding creators your customer already trusts',
      'The brief: what to hold firm on, and what to leave to the creator',
      'Rights, usage and pay, in plain terms',
      'Running creator content as ads: partnership ads (whitelisting), step by step',
      'Testing a creator’s handle against your own',
    ],
    summary:
      'Finding, briefing and paying creators, and turning their best content into ads that perform.',
  },
  {
    slug: 'values-exercise',
    kind: 'exercise',
    category: 'Exercises',
    time: '20 min',
    title: 'The values exercise',
    illustration: 'funnel',
    summary:
      'Pick ten values, cut to five, then to one. You get a short report on how you lead and build.',
  },
];

export const guides = resources.filter((r) => r.kind === 'guide');
export const categories: Category[] = ['Brand', 'Creative', 'Creators', 'Exercises'];

export function resourceHref(r: Resource): string {
  return r.kind === 'exercise' ? '/values-exercise' : `/resources/${r.slug}`;
}
export function resourceCta(r: Resource): string {
  return r.kind === 'exercise' ? 'Start the exercise' : 'Get the guide';
}
export function resourceMeta(r: Resource): string {
  return `${r.kind === 'exercise' ? 'Exercise' : r.category} · ${r.time}`;
}
