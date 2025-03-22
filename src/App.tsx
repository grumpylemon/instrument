import React from 'react';
import { HashRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import './App.css';
import FingeringPage from './pages/FingeringPage';
import ScalesPage from './pages/ScalesPage';
import WelcomePage from './pages/WelcomePage';

function App() {
  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <h1>Brass & Wind Instrument Explorer</h1>
          <nav className="main-nav">
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              end
            >
              Home
            </NavLink>
            <NavLink 
              to="/fingering" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              Fingering Chart
            </NavLink>
            <NavLink 
              to="/scales" 
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              Scales Practice
            </NavLink>
          </nav>
        </header>
        
        <main className="app-content">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/fingering" element={<FingeringPage />} />
            <Route path="/scales" element={<ScalesPage />} />
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
