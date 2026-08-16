import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // three and its example modules must resolve to one copy, or the examples
  // pull in a second instance and Three warns about it.
  resolve: { dedupe: ['three'] },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Three.js never changes between deploys; the gallery does. Splitting
        // them means a content edit does not expire 500 kB of cached library.
        manualChunks: { three: ['three'] },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
