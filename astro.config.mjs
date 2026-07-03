import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.fischer-immobilien-wiesbaden.de',
  vite: {
    plugins: [tailwindcss()],
  },
});
