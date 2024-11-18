import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import { initCanisterEnv } from './config/env';
import * as path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {},
  define: {
    'process.env.DFX_NETWORK': process.env.DFX_NETWORK === 'ic' ? JSON.stringify('ic') : JSON.stringify('local'),
    // 'process.env.CANISTER_ID_FOMOWELL_LAUNCHER':JSON.stringify('yi7jn-yyaaa-aaaam-acshq-cai')
    ...initCanisterEnv(),
  },
  server: {
    host: '0.0.0.0',
    hmr: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      path: 'path-browserify',
      // fs: 'browserify-fs',
      url: 'url',
      'source-map-js': 'source-map',
    },
  },
});
