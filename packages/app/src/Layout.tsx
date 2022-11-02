import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import KeepAliveLayout, { useKeepOutlets } from '../KeepAlive/index';

const Layout = () => {
  const { pathname } = useLocation();
  const element = useKeepOutlets();
  return element;
}
export default Layout;