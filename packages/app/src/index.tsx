import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter, Routes, Route } from 'react-router-dom';
import KeepAliveLayout, { useKeepOutlets } from '../KeepAlive/index';
import Layout from './Layout';
import Hello from './Hello';
import Users from './Users';

const App = () => {
  return (
    <KeepAliveLayout keepAlive={['/users']}>
      <HashRouter>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route path="/" element={<Hello />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Routes>
      </HashRouter>
    </KeepAliveLayout>
  );
}
const root = ReactDOM.createRoot(document.getElementById('nmi'));
root.render(React.createElement(App));
