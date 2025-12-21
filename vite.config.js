import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: [
        'src/**/*.ts',
        'src/icons/svg/index.ts',
        'src/icons/svg/index.d.ts'
      ],
      outDir: 'dist',
      rollupTypes: true,
    })
  ],
  build: {
    lib: {
        entry: {
          'grab-api': resolve(__dirname, 'src/grab-api.ts'),
          'icons': resolve(__dirname, 'src/icons/svg/index.ts'),
          'log': resolve(__dirname, 'src/log-json.ts'),
          'download': resolve(__dirname, 'src/grab-url.js')
        },
      formats: ['es', 'cjs'],
      name: 'grab-api',
      fileName: (format, entryName) => `${entryName}.${format}.js`
    },
    rollupOptions: {
      // Disable inlineDynamicImports for multiple formats
      output: {
        inlineDynamicImports: false
      },
      external: (id) => {
        // Externalize Node.js built-in modules for the download entry
        const nodeModules = [
          'fs', 'path', 'stream/promises', 'stream', 'readline', 'url', 'util', 'os', 'crypto',
          'child_process', 'events', 'buffer', 'process', 'assert', 'timers',
          'tty', 'zlib', 'http', 'https', 'net', 'dns', 'cluster', 'worker_threads'
        ];
        return nodeModules.includes(id) || id.startsWith('node:');
      }
    },
    minify: 'terser',
    sourcemap: true,
    emptyOutDir: false
  }
});
