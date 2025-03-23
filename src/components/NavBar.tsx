import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/theme.css';
import './NavBar.css';

interface NavItem {
  path: string;
  label: string;
  emoji: string;
  originalName?: string;
}

const NavBar: React.FC = () => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Define navigation items with new emoji-style naming
  const navItems: NavItem[] = [
    { path: '/', label: 'Home', emoji: '🏠' },
    { path: '/scales', label: 'Practice', emoji: '🎼', originalName: 'Scales' },
    { path: '/valve-hero', label: 'Play', emoji: '🎯', originalName: 'Valve Hero' },
    { path: '/fingering', label: 'Fingering', emoji: '👆' },
    { path: '/trumpet-tips', label: 'Tweak', emoji: '🛠️', originalName: 'Trumpet Tips' },
  ];
  
  // Add scroll listener to add shadow and blur when scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        <div className="navbar-logo">
          <Link to="/">
            <img 
              src="/assets/images/enzo-logo.png" 
              alt="Barefoot Enzo" 
              className="logo-img"
            />
          </Link>
        </div>
        
        <div className="navbar-items">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar-item ${location.pathname === item.path ? 'active' : ''}`}
              title={item.originalName || item.label}
            >
              <span className="navbar-item-emoji">{item.emoji}</span>
              <span className="navbar-item-label">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default NavBar; 