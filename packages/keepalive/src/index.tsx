import React, { useRef, createContext, useContext } from 'react';
import { useOutlet, useLocation, matchPath } from 'react-router-dom';
import type { FC } from 'react';

export const KeepAliveContext = createContext({ keepAlive: [], keepElements: {} });

const isKeepPath = (aliveList, path) => {
  let isKeep = false;
  aliveList.map(item => {
    if (item === path) {
      isKeep = true;
    }
  })
  return isKeep;
}

export function useKeepOutlets() {
  const location = useLocation();
  const element = useOutlet();
  const { keepElements, keepAlive } = useContext(KeepAliveContext);
  const isKeep = isKeepPath(keepAlive, location.pathname);
  if (isKeep) {
    keepElements.current[location.pathname] = element;
  }
  return (
    <>
      {/* 所有keepalive的组件 */}
      {
        Object.entries(keepElements.current).map(([pathname, element]: any) => (
          <div key={pathname} style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden auto' }} className="rumtime-keep-alive-layout" hidden={!matchPath(location.pathname, pathname)}>
            {element}
          </div>
        ))
      }
      {/* 当前页面 */}
      <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden auto' }} className="rumtime-keep-alive-layout-no">
        {!isKeep && element}
      </div>
    </>
  )
}

const KeepAliveLayout: FC = (props) => {
  const { keepAlive, ...other } = props;
  const keepElements = useRef({});
  function dropByCacheKey(path: string) {
    keepElements.current[path] = null;
  }

  return (
    <KeepAliveContext.Provider value={{ keepAlive, keepElements, dropByCacheKey }} {...other} />
  )
}
export default KeepAliveLayout;