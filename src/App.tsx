import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import FingeringPage from './pages/FingeringPage';
import ScalesPage from './pages/ScalesPage';
import WelcomePage from './pages/WelcomePage';
import TrumpetTipsPage from './pages/TrumpetTipsPage';
import ValveHeroPage from './pages/ValveHeroPage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <main className="app-content">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/fingering" element={<FingeringPage />} />
            <Route path="/scales" element={<ScalesPage />} />
            <Route path="/trumpet-tips" element={<TrumpetTipsPage />} />
            <Route path="/valve-hero" element={<ValveHeroPage />} />
          </Routes>
        </main>
        
        <footer className="app-footer">
          <p>Created for music students and educators</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
