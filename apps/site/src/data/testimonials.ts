/**
 * Client testimonials for the home page.
 * Entries with `placeholder: true` show while you run `pnpm dev`, so you can check the layout,
 * and are left out of the published site. Replace them with real quotes and delete the flag.
 * With no real testimonials, the home page shows the brand logos on their own.
 */
export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  placeholder?: boolean;
}

const lorem =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export const testimonials: Testimonial[] = [
  {
    quote:
      'Hugh recently ran a growth strategy audit for me, and it was humbling in the best possible way. Within days, he understood our data and the dynamics of our business better than I ever could. He drew on deep experience to show us where to focus and, just as importantly, which paths would have wasted time. I came away clearer, more focused and better prepared. Would recommend to a friend.',
    name: 'Amy Williams',
    role: 'Chief Executive Officer, Viva Voce',
  },
  { quote: lorem, name: 'Name Surname', role: 'Role, Brand', placeholder: true },
  { quote: lorem, name: 'Name Surname', role: 'Role, Brand', placeholder: true },
];
