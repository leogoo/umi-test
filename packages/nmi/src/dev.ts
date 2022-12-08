import express from 'express';
import { createServer } from 'http';
import fs from 'fs';
import { serve, build, ServeOnRequestArgs } from 'esbuild';
import path, { resolve } from 'path';
import portfinder from 'portfinder';
import { DEFAULT_OUTDIR, DEFAULT_PORT, DEFAULT_PLATFORM } from './constants';
import { generateEntry, generateHtml, getAppData, getRoutes, getUserConfig, getMockConfig } from './utils';

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
  app.get('/', (_req, res, next) => {
    res.set('Content-Type', 'text/html');
    const output = path.resolve(cwd, DEFAULT_OUTDIR);
    const htmlPath = path.join(output, 'index.html');
    if (fs.existsSync(htmlPath)) {
      fs.createReadStream(htmlPath).on('error', next).pipe(res);
    } else {
      next();
    }
  });
  
  const nmiServer = createServer(app);
  //修改用户配置，重启服务
  nmiServer.on('rebuild', async () => {
    console.log('rebuild');
    buildMain(nmiServer);
  });
  
  const buildMain = async (nmiServer) => {
    const appData = getAppData(cwd);
    const routes = getRoutes(appData);
    // 获取用户配置
    const mockConfig = await getUserConfig({appData, nmiServer});
    // mock中间件
    app.use((req, res, next) => {
      
    });
    // mock配置
    await getMockConfig({appData, nmiServer});
    // 生成入口文件src/index
    await generateEntry({ appData, routes});
    // 生成html
    await generateHtml({ appData});
    // 由上面生成的入口文件打包
    await build({
        outdir: appData.paths.absOutputPath,
        platform: DEFAULT_PLATFORM,
        bundle: true,
        define: {
          'process.env.NODE_ENV': JSON.stringify('development'),
        },
        external: ['esbuild'],
        entryPoints: [appData.paths.absEntryPath],
      })
  }
  nmiServer.listen(port, async ()=>{
    console.log(`listening at ${port}`);
    buildMain(nmiServer)
  })
}