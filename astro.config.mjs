import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.sim-immoservice.de',
  vite: {
    plugins: [tailwindcss()],
  },
});
