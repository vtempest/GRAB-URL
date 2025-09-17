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
          'icons': resolve(__dirname, 'src/icons/svg/index.ts')
        },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format}.js`
    },
    rollupOptions: {
      // Disable inlineDynamicImports for multiple formats
      output: {
        inlineDynamicImports: false
      }
    },
    minify: 'terser',
    sourcemap: true,
    emptyOutDir: false
  }
});
