import React from 'react';
import { SidebarCollapseProvider } from '../../context/SidebarCollapseContext';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children }) => (
  <SidebarCollapseProvider>
    <div className="layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  </SidebarCollapseProvider>
);

export default Layout;
