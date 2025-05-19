import React from 'react';
import Navbar from './Navbar';
import '../../styles/layout.css';

const Layout = ({ children }) => {
  console.log("Layout: Rendering with children");
  
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
