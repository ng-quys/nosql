import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { spawn } from 'child_process';
import net from 'net';

function backendPlugin() {
  return {
    name: 'freshleaf-backend-starter',
    configureServer() {
      // Check if backend on port 5000 is already running
      const tester = net.createConnection({ port: 5000 }, () => {
        tester.end();
      });
      tester.on('error', () => {
        console.log('[Vite] Launching FreshLeaf Express backend on port 5000...');
        const child = spawn('npx', ['tsx', 'backend/server.ts'], {
          stdio: 'inherit',
          shell: true,
        });
        process.on('exit', () => child.kill());
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), backendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
