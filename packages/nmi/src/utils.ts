import { build } from 'esbuild';
import { existsSync, readdirSync, statSync } from 'fs';
import { mkdir, writeFileSync } from 'fs';
import path from 'path';
import glob from 'glob';
import winpath from 'winpath';
import { DEFAULT_ENTRY_POINT, DEFAULT_OUTDIR, DEFAULT_GLOBAL_LAYOUTS, DEFAULT_FRAMEWORK_NAME, DEFAULT_CONFIG_FILE } from './constants';

export const getAppData = (cwd) => {
    const absSrcPath = path.resolve(cwd, 'src');
    const absPagesPath = path.resolve(absSrcPath, 'pages');
    const absNodeModulesPath = path.resolve(cwd, 'node_modules');
    const absTmpPath = path.resolve(absNodeModulesPath, 'templates');
    const absEntryPath = path.resolve(absTmpPath, DEFAULT_ENTRY_POINT);
    const absOutputPath = path.resolve(cwd, DEFAULT_OUTDIR);

    const paths = {
      cwd,
      absSrcPath,
      absPagesPath,
      absNodeModulesPath,
      absTmpPath,
      absEntryPath,
      absOutputPath,
    };
    const pkg = require(path.resolve(cwd, 'package.json'));
    return {
      paths,
      pkg,
    };
}

export const getFiles = (root) => {
  if (!existsSync(root)) return[];
  return readdirSync(root).filter((file) => {
    const absFile = path.join(root, file);
    const fileStat = statSync(absFile);
    const isFile = fileStat.isFile();
    if (isFile) {
      if (!/\.tsx?$/.test(file)) return false;
    }
    return true;
  })
}
// 文件信息转路由配置
export const filesToRoutes = (files: string[], pagesPath: string) => {
  return files.map(file => {
    let pagePath = path.basename(file, path.extname(file));
    // windows系统路径处理
    const element = winpath.winPath(path.resolve(pagesPath, pagePath));
    if (pagePath === 'home') pagePath = '';
    return {
      path: `/${pagePath}`,
      element,
    }
  });
}
export const getRoutes = (appData) => {
    const files = getFiles(appData.paths.absPagesPath);
    const routes = filesToRoutes(files, appData.paths.absPagesPath);
    const layoutPath = path.resolve(appData.paths.absSrcPath, DEFAULT_GLOBAL_LAYOUTS);

    if (!existsSync(layoutPath)) {
      return routes;
    } else {
      return [
        {
          path: '/',
          element: layoutPath.replace(path.extname(layoutPath), ''),
          routes: routes,
        }
      ]
    }
}
let count = 0;
const getRoutesStr= (routes) => {
  let routesStr = '';
  let importStr = '';
  routes.forEach(route => {
    count += 1;
    const { path, element } = route || {};
    importStr += `import A${count} from '${element}';\n`;
    routesStr += `\n<Route path='${path}' element={<A${count} />}>`;
    if (route.routes) {

    }
    routesStr += '</Route>\n';
  })
  return { routesStr, importStr};
};
// 生成入口文件src/index.tsx
export const generateEntry = ({ appData, routes }) => {
  return new Promise((resolve, reject) => {
    count = 0;
    const { routesStr, importStr} = getRoutesStr(routes);
    const content = `
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route } from 'react-router-dom';
${importStr}

const App = () => {
  return (
    <HashRouter>
      <Routes>
        ${routesStr}
      </Routes>
    </HashRouter>
  )
};
const root = ReactDOM.createRoot(document.getElementById('nmi'));
root.render(React.createElement(App));
    `;
    try {
      mkdir(path.dirname(appData.paths.absEntryPath), { recursive: true}, (err) => {
        if (err) {
          console.log('err', err)
        }
        writeFileSync(appData.paths.absEntryPath, content, 'utf-8');
        resolve({});
      })
    } catch(err) {

    }
  })
}
// 生成html
export const generateHtml = ({ appData }) => {
  return new Promise((resolve, reject) => {
    const content = `
    <!DOCTYPE html>
    <html>
      <meta charset="UTF-8">
      <title>${appData.pkg.name}</title>
    <head>
    </head>
    <body>
      <div id="nmi">
        <span>loading...</span>
      </div>
      <script src="/${DEFAULT_OUTDIR}/${DEFAULT_FRAMEWORK_NAME}"></script>
      <script src="/nmi/client.js"></script>
    </body>
    </html>
    `;
    try {
      const htmlPath = path.resolve(appData.paths.absOutputPath, 'index.html');
      mkdir(path.dirname(htmlPath), { recursive: true}, (err) => {
        if(err) {

        }
        writeFileSync(htmlPath, content, 'utf-8');
        resolve({})
      })
    } catch (err) {
      reject({});
    }
  })
}

// 获取用户配置
export const getUserConfig = ({ appData, nmiServer }) => {
  return new Promise(async (resolve, reject) => {
    let config = {};
    const configFile = path.resolve(appData.paths.cwd, DEFAULT_CONFIG_FILE);

    if (existsSync(configFile)) {
      await build({
        format: 'cjs',
        outdir: appData.paths.absOutputPath,
        bundle: true,
        watch: {
          onRebuild: () => {
            // 刷新
            nmiServer.emit('rebuild', { appData })
          }
        },
        define: {
          'process.env.NODE_ENV': JSON.stringify('development'),
        },
        external: ['esbuild'],
        entryPoints: [configFile]
      });
      try {
        const targetConfigFile = path.resolve(appData.paths.absOutputPath, 'nmi.config.js');
        // 清除require缓存
        delete require.cache[targetConfigFile];
        config = require(targetConfigFile).default;
      } catch (err) {
        console.log(err);
      }
    }
    resolve(config);
  })
}

export function getMockConfig({ appData, nmiServer }) {
  return new Promise(async (resolve, reject) => {
    const mockDir = path.resolve(appData.paths.cwd, 'mock');
    const mockFiles = glob.sync('**/*.ts', {
      cwd: mockDir,
    });
    // 取得绝对路径
    const ret = mockFiles.map(memo => path.resolve(mockDir, memo));
    // 临时文件
    const mockOutDir = path.resolve(appData.paths.absTmpPath, 'mock');
    await build({
      format: 'cjs',
      outdir: mockOutDir,
      bundle: true,
      watch: {

      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('development'),
      },
      external: ['esbuild'],
      entryPoints: ret,
    });
    console.log(mockOutDir);
    // 读配置
    // 格式化
  })
}