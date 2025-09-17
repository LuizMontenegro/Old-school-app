import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig(() => {
  const input = { app: resolve(__dirname, 'app.html') };
  const idx = resolve(__dirname, 'index.html');
  if (fs.existsSync(idx)) input.index = idx;
  return {
    build: {
      rollupOptions: { input },
    },
  };
});
