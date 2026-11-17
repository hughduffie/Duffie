// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

// The site is static. Only the two form endpoints in src/pages/api run on demand.
export default defineConfig({
  site: 'https://hughduffie.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  adapter: cloudflare({ imageService: 'compile' }),
  // No sessions, so the adapter does not ask Cloudflare for a KV namespace.
  session: false,
  integrations: [sitemap({ filter: (page) => !page.includes('/api/') })],
});
