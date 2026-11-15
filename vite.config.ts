import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Dev-only bridge that mounts the real Vercel Function at /api/analyze during
 * `npm run dev`, so the whole flow works without the Vercel CLI. It loads the
 * *same* handler module -- there is no second implementation to drift.
 * `vercel dev` and production use the function directly and ignore this.
 */
function devApiPlugin(mode: string): Plugin {
  return {
    name: 'recyclevision-dev-api',
    apply: 'serve',
    configureServer(server) {
      // Make server-only settings from .env / .env.local visible to the handler.
      // The file wins over anything already in process.env: otherwise a dev
      // server started before an edit keeps serving the old models, and the only
      // symptom is a 502 from a provider that no longer offers them.
      const env = loadEnv(mode, process.cwd(), '');
      for (const [key, value] of Object.entries(env)) {
        if (!key.startsWith('VITE_')) process.env[key] = value;
      }

      // Say out loud what will actually be called. Never print the keys.
      const described = (['groq', 'nvidia'] as const).map((id) => {
        const hasKey = Boolean(
          id === 'groq'
            ? process.env.GROQ_API_KEY
            : process.env.NVIDIA_NIM_API_KEY || process.env.NVIDIA_API_KEY,
        );
        if (!hasKey) return `${id}: no key`;
        const text = id === 'groq' ? process.env.GROQ_MODEL : process.env.NVIDIA_NIM_MODEL;
        const vision =
          id === 'groq' ? process.env.GROQ_VISION_MODEL : process.env.NVIDIA_NIM_VISION_MODEL;
        return `${id}: text=${text || '(default)'} vision=${vision || 'none'}`;
      });
      server.config.logger.info(
        `  [32m➜[39m  [1mAI[22m:      ${described.join('  |  ')}`,
        { clear: false },
      );

      server.middlewares.use('/api/analyze', async (req, res) => {
        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = Buffer.concat(chunks);

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(key, value);
            else if (Array.isArray(value)) headers.set(key, value.join(', '));
          }
          if (!headers.has('x-forwarded-for')) {
            headers.set('x-forwarded-for', req.socket.remoteAddress ?? '127.0.0.1');
          }

          const request = new Request('http://localhost/api/analyze', {
            method: req.method ?? 'GET',
            headers,
            body: body.length > 0 ? body : undefined,
          });

          const module = await server.ssrLoadModule('/api/analyze.ts');
          const response: Response = await module.default(request);

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.config.logger.error(`[dev-api] ${String(error)}`);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              ok: false,
              error: {
                code: 'internal_error',
                message: 'The local dev API bridge failed. See the terminal for details.',
                retryable: true,
              },
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApiPlugin(mode)],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Keep the first paint small: charts and animation code are only needed
        // on the dashboard and on interaction.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          motion: ['framer-motion'],
        },
      },
    },
  },
}));
