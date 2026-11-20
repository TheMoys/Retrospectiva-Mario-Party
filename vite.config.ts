import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

function syncRelayPlugin(): Plugin {
  // Map of roomCode -> Set of ServerResponse (SSE clients)
  const roomClients = new Map<string, Set<ServerResponse>>();

  return {
    name: 'sprint-party-sync-relay',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

        // 1. SSE Stream: /api/events?room=STAR
        if (url.pathname === '/api/events') {
          const room = (url.searchParams.get('room') || 'STAR').toUpperCase();
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write(': connected\n\n');

          if (!roomClients.has(room)) {
            roomClients.set(room, new Set());
          }
          const clients = roomClients.get(room)!;
          clients.add(res);

          req.on('close', () => {
            clients.delete(res);
            if (clients.size === 0) roomClients.delete(room);
          });
          return;
        }

        // 2. HTTP POST message relay: /api/message
        if (url.pathname === '/api/message' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const room = (data.room || 'STAR').toUpperCase();
              const action = data.action;
              const senderId = data.senderId || 'anon';

              const clients = roomClients.get(room);
              if (clients) {
                const payload = `data: ${JSON.stringify({ action, senderId })}\n\n`;
                clients.forEach((client) => {
                  try {
                    client.write(payload);
                  } catch {
                    clients.delete(client);
                  }
                });
              }

              res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              });
              res.end(JSON.stringify({ ok: true, delivered: clients ? clients.size : 0 }));
            } catch (err: any) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ ok: false, error: err.message }));
            }
          });
          return;
        }

        // Handle CORS preflight for /api/message
        if (url.pathname === '/api/message' && req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          res.end();
          return;
        }

        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), syncRelayPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
