import express from 'express';
import { createServer } from 'http';
import { serve, build, ServeOnRequestArgs } from 'esbuild';
import path from 'path';
import portfinder from 'portfinder';
import { DEFAULT_ENTRY_POINT, DEFAULT_OUTDIR, DEFAULT_PLATFORM, DEFAULT_PORT, DEFAULT_HOST, DEFAULT_BUILD_PORT } from './constants';
import { createWebSocketServer } from './server';

export const dev = async () => {
  const cwd = process.cwd();
  const esbuildOutput = path.resolve(cwd, DEFAULT_OUTDIR);
  const app = express();
  // 端口自检
  const port = await portfinder.getPortPromise({
    port: DEFAULT_PORT,
  });

  app.use(`/${DEFAULT_OUTDIR}`, express.static(esbuildOutput));
  // __dirname = /lib
  app.use(`/nmi`, express.static(path.resolve(__dirname, 'client')));
  
  app.get('/', (_req, res) => {
    res.set('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <title>nmi</title>
    </head>
    
    <body>
        <div id="nmi">
            <span>loading...</span>
        </div>
        <script src="/${DEFAULT_OUTDIR}/index.js"></script>
    </body>
    </html>`);
  });
  
  const nmiServer = createServer(app);
  const ws = createWebSocketServer(nmiServer);

  function sendMessage(type: string, data?: any) {
      ws.send(JSON.stringify({ type, data }));
  }

  nmiServer.listen(port, async ()=>{
    console.log(`listening at ${port}`);
    try {
      await build({
        outdir: esbuildOutput,
        platform: DEFAULT_PLATFORM,
        bundle: true,
        watch: {
          onRebuild: (err, res) => {
            if (err) {
              console.log(JSON.stringify(err));
              return;
            }
            sendMessage('reload')
          }
        },
        define: {
          'process.env.NODE_ENV': JSON.stringify('development'),
        },
        external: ['esbuild'],
        entryPoints: [path.resolve(cwd, DEFAULT_ENTRY_POINT)],
      })
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  });
}