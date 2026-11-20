// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages project-site deployment (CNAME removed → served at the
// github.io subpath). base must match the subpath so internal links resolve.
// Override with AZT_BASE if serving from a root/custom domain instead.
export default defineConfig({
  site: 'https://mamm00.github.io',
  base: process.env.AZT_BASE || '/BetaAzWebsite/',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  preview: {
    allow: ['4321-ikehw3taqv76i4aoc7lt0.e2b.app'],
  },
  integrations: [
    react(),
    sitemap({
      // Keep admin routes out of the index — they are not public content.
      filter: (url) => !/\/admin(\/|$)/.test(url),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
