// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Dual deploy target: GitHub Pages subpath AND root domain from one config.
// AZT_BASE=/al-azhar-tex/ for Pages; default '/' for the root domain.
export default defineConfig({
  site: 'https://alazhartex.com',
  base: process.env.AZT_BASE || '/',
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
