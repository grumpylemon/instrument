import React from 'react';
import NavBar from './NavBar';
import '../styles/theme.css';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  showNavBar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showNavBar = true }) => {
  return (
    <div className="layout">
      {showNavBar && <NavBar />}
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} Barefoot Enzo. All rights reserved.</p>
          <p className="footer-tagline">Making music fun for everyone!</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 