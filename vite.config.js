import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import authHandler from './api/auth/[action].js';

function localAuthApi() {
  return {
    name: 'bhojango-local-auth-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname;
        const match = pathname.match(/^\/api\/auth\/(send-otp|verify-otp)$/);
        if (!match) return next();

        req.query = { action: match[1] };
        if (req.method === 'POST') {
          try {
            const chunks = [];
            let size = 0;
            for await (const chunk of req) {
              size += chunk.length;
              if (size > 8192) {
                res.statusCode = 413;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ error: 'Request is too large.' }));
                return;
              }
              chunks.push(chunk);
            }
            const raw = Buffer.concat(chunks).toString('utf8');
            req.body = raw ? JSON.parse(raw) : {};
          } catch {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Invalid JSON request.' }));
            return;
          }
        }

        const response = {
          setHeader(name, value) { res.setHeader(name, value); return this; },
          status(code) { res.statusCode = code; return this; },
          json(body) { res.end(JSON.stringify(body)); return this; },
        };
        try {
          await authHandler(req, response);
        } catch {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Local OTP API failed.' }));
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
  return { plugins: [react(), localAuthApi()] };
});
