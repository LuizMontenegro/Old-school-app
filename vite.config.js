import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      // Alguns commits podem não incluir index.html no root no Vercel.
      // Usamos apenas app.html como entrada.
      input: {
        app: resolve(__dirname, 'app.html'),
      },
    },
  },
});
