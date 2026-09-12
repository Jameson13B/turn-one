// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Turn One is a fully static site. No adapter, no SSR — see docs/TDD.md §3.
export default defineConfig({
  site: 'https://turnone.example', // replace with the real domain before launch
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
