import React from 'react';
import { NavLink } from 'react-router-dom';
import Button from './button';
import Card from './card';
import '../../styles/theme.css';
import './CompactNav.css';

interface CompactNavProps {
  backgroundImage?: string;
}

const CompactNav: React.FC<CompactNavProps> = ({ backgroundImage }) => {
  return (
    <Card className="compact-nav-container" withBlur={true} hoverable={false}>
      {backgroundImage && (
        <div 
          className="compact-nav-background" 
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <h2 className="compact-nav-title">Brass & Wind Instrument Explorer</h2>
      <nav className="compact-nav">
        <NavLink to="/" end>
          {({ isActive }) => (
            <Button 
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              emoji="🏠"
            >
              Home
            </Button>
          )}
        </NavLink>
        
        <NavLink to="/fingering">
          {({ isActive }) => (
            <Button 
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              emoji="🎺"
            >
              Fingering Chart
            </Button>
          )}
        </NavLink>
        
        <NavLink to="/scales">
          {({ isActive }) => (
            <Button 
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              emoji="🎵"
            >
              Scales Practice
            </Button>
          )}
        </NavLink>
        
        <NavLink to="/trumpet-tips">
          {({ isActive }) => (
            <Button 
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              emoji="💡"
            >
              Trumpet Tips
            </Button>
          )}
        </NavLink>
        
        <NavLink to="/valve-hero">
          {({ isActive }) => (
            <Button 
              variant={isActive ? "secondary" : "ghost"}
              size="sm"
              emoji="🎮"
            >
              Valve Hero
            </Button>
          )}
        </NavLink>
      </nav>
    </Card>
  );
};

export default CompactNav; 