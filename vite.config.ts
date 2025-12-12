import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    ssr: 'index.ts',
    outDir: 'dist',
    target: 'node18',

    rollupOptions: {
      output: {
        format: 'esm',
        entryFileNames: '[name].js',
        preserveModules: false,
      },
      external: (id) => {
        if (id.startsWith('node:') ||
            ['fs', 'fs/promises', 'path', 'http', 'https', 'crypto', 'stream', 'util', 'events', 'buffer', 'url'].includes(id) ||
            id.startsWith('node_modules/minio') ||
            id.includes('node_modules') && !id.includes('.ts')) {
          return true;
        }
        return false;
      },
    },

    commonjsOptions: {
      transformMixedEsModules: true,
      strictRequires: false,
      esmExternals: true,
    },
  },

  ssr: {
    external: ['minio'],
    noExternal: [],
    target: 'node',
  },
});
