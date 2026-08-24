import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Live site URL — used for canonical URLs / Open Graph tags.
  site: 'https://atom.rosybuds.edu.np',
  vite: {
    plugins: [tailwindcss()],
  },
});
