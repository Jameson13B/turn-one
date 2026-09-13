// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Turn One is a fully static site. No adapter, no SSR — see docs/TDD.md §3.
export default defineConfig({
  // Set this to your real Netlify URL (e.g. https://turn-one.netlify.app), then
  // to the custom domain when you have one. Used for canonical URLs and sitemaps.
  site: process.env.URL ?? 'http://localhost:4321',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
