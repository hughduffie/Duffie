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
  { quote: lorem, name: 'Amy', role: 'Role, Brand', placeholder: true },
  { quote: lorem, name: 'Name Surname', role: 'Role, Brand', placeholder: true },
  { quote: lorem, name: 'Name Surname', role: 'Role, Brand', placeholder: true },
];
