import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';
import './WelcomePage.css';

const WelcomePage: React.FC = () => {
  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1>Welcome to Brass & Wind Instrument Explorer</h1>
        
        <div className="trumpet-cartoon">
          {/* This SVG is a simplified cartoon trumpet inspired by the Barefoot Enzo Trumpet Cartoon */}
          <svg width="400" height="200" viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
            {/* Bell */}
            <path d="M350,100 C380,70 390,130 350,100 Z" fill="#f9d423" stroke="#000" strokeWidth="2" />
            
            {/* Main tube */}
            <path d="M50,100 L350,100" stroke="#f9d423" strokeWidth="25" fill="none" />
            
            {/* Valves */}
            <circle cx="120" cy="80" r="15" fill="#e6b422" stroke="#000" strokeWidth="2" />
            <circle cx="170" cy="80" r="15" fill="#e6b422" stroke="#000" strokeWidth="2" />
            <circle cx="220" cy="80" r="15" fill="#e6b422" stroke="#000" strokeWidth="2" />
            
            {/* Valve stems */}
            <line x1="120" y1="65" x2="120" y2="45" stroke="#000" strokeWidth="4" />
            <line x1="170" y1="65" x2="170" y2="45" stroke="#000" strokeWidth="4" />
            <line x1="220" y1="65" x2="220" y2="45" stroke="#000" strokeWidth="4" />
            
            {/* Mouthpiece */}
            <circle cx="50" cy="100" r="10" fill="#e6b422" stroke="#000" strokeWidth="2" />
            
            {/* Cartoon eyes */}
            <circle cx="280" cy="80" r="8" fill="#fff" stroke="#000" strokeWidth="2" />
            <circle cx="280" cy="80" r="3" fill="#000" />
            <circle cx="310" cy="80" r="8" fill="#fff" stroke="#000" strokeWidth="2" />
            <circle cx="310" cy="80" r="3" fill="#000" />
            
            {/* Smile */}
            <path d="M275,110 Q295,125 315,110" fill="none" stroke="#000" strokeWidth="2" />
          </svg>
        </div>
        
        <div className="welcome-message">
          <p>Explore fingering charts and practice scales for various brass and wind instruments!</p>
          <p>This app helps music students and educators learn proper fingerings and scales.</p>
        </div>
        
        <div className="welcome-buttons">
          <Link to="/fingering" className="welcome-button">
            Explore Fingering Charts
          </Link>
          <Link to="/scales" className="welcome-button">
            Practice Scales
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage; 