import { defineConfig } from 'vite';
import { resolve } from 'path';
import { type Plugin } from 'vite';

export function chromeExtensionHtmlFlatten(): Plugin {
  return {
    name: 'chrome-extension-html-flatten',
    enforce: 'post',
    generateBundle(_, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (!fileName.endsWith('.html')) continue;

        const basename = fileName.split('/').pop()!;
        if (basename === fileName) continue;

        const depth  = fileName.split('/').length - 1;
        const upPath = '../'.repeat(depth);

        if (chunk.type === 'asset' && typeof chunk.source === 'string') {
          chunk.source = chunk.source.replaceAll(upPath, '');
          chunk.source = chunk.source.replace(/(src|href)="\//g, '$1="');
          chunk.source = chunk.source.replaceAll(' crossorigin ', ' ');
          chunk.source = chunk.source.replaceAll(' crossorigin>', '>');
          
          this.emitFile({
            type: 'asset',
            fileName: basename,
            source: chunk.source
          });
          
          // Delete old file
          delete bundle[fileName];
        }
      }
    },
  };
}

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'EVAL') return;
        warn(warning);
      },
      input: {
        popup:               resolve(__dirname, 'src/ui/popup.html'),
        background:          resolve(__dirname, 'src/background.ts'),
        'content-preflight': resolve(__dirname, 'src/content-preflight.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
      external: [],
      preserveEntrySignatures: 'strict'
    },
  },
  plugins: [
    chromeExtensionHtmlFlatten(),
  ],
});