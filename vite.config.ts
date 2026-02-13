
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {

            if (id.includes('@nivo')) {
              return 'nivo';
            }
            if (id.includes('@tremor') || id.includes('@headlessui') || id.includes('@heroicons')) {
              return 'ui-libs';
            }
            if (id.includes('@tanstack')) {
              return 'tanstack';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            return 'vendor'; // Fallback for other node_modules
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000
  }
});
