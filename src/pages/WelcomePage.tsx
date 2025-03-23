// src/pages/WelcomePage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/button';
import PanelWrapper from '../components/ui/PanelWrapper';
import Card from '../components/ui/card';
import '../styles/theme.css';
import './WelcomePage.css';

const WelcomePage: React.FC = () => {
  return (
    <PanelWrapper className="welcome-wrapper">
      <div className="hero-section">
        <img 
          src="/assets/images/barefoot-enzo-banner.svg" 
          alt="Barefoot Enzo Banner" 
          className="hero-image"
        />
        <div className="hero-text">
          <h1 className="hero-title">Barefoot Enzo's Brass Adventure</h1>
          <p className="hero-subtitle">
            Learn trumpet fingerings, master scales, and challenge yourself with our fun Valve Hero game!
            Perfect for beginners and young musicians exploring the exciting world of brass instruments.
          </p>
        </div>
      </div>

      <div className="feature-section">
        <Card className="feature-card">
          <div className="feature-icon">🎮</div>
          <h2>Valve Hero</h2>
          <p>Test your fingering knowledge in this fun, fast-paced game! Read notes and select the correct valves as quickly as you can.</p>
          <Link to="/valve-hero">
            <Button variant="secondary" emoji="🔥">Play Now</Button>
          </Link>
        </Card>

        <Card className="feature-card">
          <div className="feature-icon">🎵</div>
          <h2>Practice Scales</h2>
          <p>Explore scales with visual and audio feedback. Hear the notes, see the fingerings, and build your skills one note at a time.</p>
          <Link to="/scales">
            <Button variant="primary" emoji="🎹">Go to Scales</Button>
          </Link>
        </Card>

        <Card className="feature-card">
          <div className="feature-icon">📘</div>
          <h2>Trumpet Tips</h2>
          <p>Get beginner-friendly advice, breathing exercises, and interactive diagrams to develop proper technique.</p>
          <Link to="/trumpet-tips">
            <Button variant="primary" emoji="💡">View Tips</Button>
          </Link>
        </Card>
        
        <Card className="feature-card">
          <div className="feature-icon">🎺</div>
          <h2>Fingering Charts</h2>
          <p>Learn and visualize trumpet fingerings with comprehensive charts for all notes. Perfect for beginners learning note positions.</p>
          <Link to="/fingering">
            <Button variant="primary" emoji="📊">View Charts</Button>
          </Link>
        </Card>
      </div>
    </PanelWrapper>
  );
};

export default WelcomePage;
