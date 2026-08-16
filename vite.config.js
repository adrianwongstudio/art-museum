import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // three and its example modules must resolve to one copy, or the examples
  // pull in a second instance and Three warns about it.
  resolve: { dedupe: ['three'] },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
});
