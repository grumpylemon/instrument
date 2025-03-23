import React, { useState, useEffect } from 'react';
import '../App.css';
import './TrumpetTipsPage.css';
import TimeStamp from '../components/TimeStamp';

interface TrumpetTipsPageProps {}

// Interface for the breathing exercise timer
interface BreathingExerciseState {
  isRunning: boolean;
  phase: 'inhale' | 'hold' | 'exhale' | 'rest';
  timeLeft: number;
  counts: {
    inhale: number;
    hold: number;
    exhale: number;
    rest: number;
  };
}

// Valve patterns for common trumpet notes (simplified for beginners)
const BEGINNER_TRUMPET_FINGERINGS = {
  'C4': [0, 0, 0], // Open (no valves)
  'D4': [1, 3, 0], // Valves 1 and 3
  'E4': [1, 2, 0], // Valves 1 and 2
  'F4': [1, 0, 0], // Valve 1
  'G4': [0, 0, 0], // Open (no valves)
  'A4': [1, 2, 0], // Valves 1 and 2
  'Bb4': [1, 0, 0], // Valve 1
  'C5': [0, 0, 0], // Open (no valves)
};

const TrumpetTipsPage: React.FC<TrumpetTipsPageProps> = () => {
  // State for collapsible sections
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    'getting-started': true,
    'embouchure': true,
    'breathing': true,
    'practice': true,
    'problems': true,
    'resources': true
  });

  // State for the breathing exercise timer
  const [breathingExercise, setBreathingExercise] = useState<BreathingExerciseState>({
    isRunning: false,
    phase: 'inhale',
    timeLeft: 4,
    counts: {
      inhale: 4,
      hold: 4,
      exhale: 4,
      rest: 2
    }
  });

  // State for selected fingering note
  const [selectedNote, setSelectedNote] = useState<string | null>('C4');

  // Timer effect for breathing exercise
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (breathingExercise.isRunning) {
      timer = setInterval(() => {
        setBreathingExercise(prev => {
          const newTimeLeft = prev.timeLeft - 1;
          
          if (newTimeLeft <= 0) {
            // Move to next phase
            let nextPhase: 'inhale' | 'hold' | 'exhale' | 'rest';
            let nextTimeLeft: number;
            
            switch (prev.phase) {
              case 'inhale':
                nextPhase = 'hold';
                nextTimeLeft = prev.counts.hold;
                break;
              case 'hold':
                nextPhase = 'exhale';
                nextTimeLeft = prev.counts.exhale;
                break;
              case 'exhale':
                nextPhase = 'rest';
                nextTimeLeft = prev.counts.rest;
                break;
              case 'rest':
                nextPhase = 'inhale';
                nextTimeLeft = prev.counts.inhale;
                break;
              default:
                nextPhase = 'inhale';
                nextTimeLeft = prev.counts.inhale;
            }
            
            return {
              ...prev,
              phase: nextPhase,
              timeLeft: nextTimeLeft
            };
          } else {
            return {
              ...prev,
              timeLeft: newTimeLeft
            };
          }
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [breathingExercise.isRunning]);
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Start/stop breathing exercise
  const toggleBreathingExercise = () => {
    setBreathingExercise(prev => ({
      ...prev,
      isRunning: !prev.isRunning,
      timeLeft: prev.isRunning ? prev.timeLeft : prev.counts.inhale,
      phase: prev.isRunning ? prev.phase : 'inhale'
    }));
  };
  
  // Update breathing exercise counts
  const updateBreathingCounts = (phase: 'inhale' | 'hold' | 'exhale' | 'rest', value: number) => {
    setBreathingExercise(prev => ({
      ...prev,
      counts: {
        ...prev.counts,
        [phase]: value
      },
      timeLeft: prev.phase === phase ? value : prev.timeLeft
    }));
  };
  
  // Render trumpet valves with fingering
  const renderTrumpetFingering = (fingering: number[]) => {
    return (
      <div className="trumpet-interactive-fingering">
        <div className="trumpet-valves">
          {fingering.map((pressed, index) => (
            <div key={index} className={`trumpet-valve ${pressed ? 'pressed' : ''}`}>
              <div className="trumpet-valve-cap"></div>
              <div className="trumpet-valve-stem"></div>
              <span className="valve-number">{index + 1}</span>
            </div>
          ))}
        </div>
        <div className="trumpet-body">
          <div className="trumpet-mouthpiece"></div>
          <div className="trumpet-main-tube"></div>
          <div className="trumpet-bell"></div>
        </div>
      </div>
    );
  };
  
  // Render embouchure diagram
  const renderEmbouchureDiagram = () => {
    return (
      <div className="embouchure-diagram">
        <div className="embouchure-examples">
          <div className="embouchure-example correct">
            <div className="embouchure-face">
              <div className="embouchure-lips correct">
                <div className="upper-lip"></div>
                <div className="lower-lip"></div>
              </div>
              <div className="embouchure-mouthpiece"></div>
            </div>
            <p className="embouchure-label">Correct Embouchure</p>
            <ul className="embouchure-points">
              <li>Corners firm</li>
              <li>Center relaxed</li>
              <li>50/50 placement</li>
            </ul>
          </div>
          
          <div className="embouchure-example incorrect">
            <div className="embouchure-face">
              <div className="embouchure-lips incorrect">
                <div className="upper-lip puffed"></div>
                <div className="lower-lip puffed"></div>
              </div>
              <div className="embouchure-mouthpiece"></div>
            </div>
            <p className="embouchure-label">Incorrect Embouchure</p>
            <ul className="embouchure-points">
              <li>Puffed cheeks</li>
              <li>Loose corners</li>
              <li>Uneven pressure</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="page-content">
      <h2 className="page-title">Trumpet Tips for Beginners</h2>
      
      <div className="tips-container">
        <section className="tip-section">
          <h3 
            onClick={() => toggleSection('getting-started')} 
            className="section-header"
          >
            Getting Started {expandedSections['getting-started'] ? '▼' : '▶'}
          </h3>
          {expandedSections['getting-started'] && (
            <div className="section-content">
              <div className="tip-card">
                <h4>Proper Assembly and Handling</h4>
                <p>
                  Always handle your trumpet with clean hands and avoid touching the valves unnecessarily.
                  When assembling, make sure all slides are properly seated and valves are properly aligned.
                  Never force any parts together.
                </p>
              </div>
              
              <div className="tip-card">
                <h4>Daily Maintenance</h4>
                <p>
                  After playing, empty all water from the trumpet using the water keys.
                  Wipe down the exterior with a clean, soft cloth to remove fingerprints and oils.
                  Store your trumpet in its case when not in use to protect it from dust and damage.
                </p>
              </div>
              
              <div className="tip-card">
                <h4>Weekly Maintenance</h4>
                <p>
                  Once a week, remove and clean your mouthpiece with mild soap and lukewarm water.
                  Apply a small amount of valve oil to each valve by removing them one at a time.
                  Apply slide grease to the tuning slide to keep it moving freely.
                </p>
              </div>
            </div>
          )}
        </section>
        
        <section className="tip-section">
          <h3 
            onClick={() => toggleSection('embouchure')} 
            className="section-header"
          >
            Developing Your Embouchure {expandedSections['embouchure'] ? '▼' : '▶'}
          </h3>
          {expandedSections['embouchure'] && (
            <div className="section-content">
              <div className="tip-card">
                <h4>Forming the Embouchure</h4>
                <p>
                  Keep your lips firm but relaxed, with the corners of your mouth tightened.
                  Position the mouthpiece so that it's about 50% on the upper lip and 50% on the lower lip.
                  Avoid puffing your cheeks - keep facial muscles engaged but not tense.
                </p>
              </div>
              
              <div className="tip-card interactive-card">
                <h4>Interactive Embouchure Diagram</h4>
                {renderEmbouchureDiagram()}
              </div>
              
              <div className="tip-card">
                <h4>Developing Lip Strength</h4>
                <p>
                  Practice buzzing your lips without the mouthpiece daily.
                  Practice with just the mouthpiece for 5-10 minutes per day.
                  Start with short practice sessions and gradually build endurance.
                </p>
              </div>
              
              <div className="tip-card">
                <h4>Common Embouchure Problems</h4>
                <p>
                  <strong>Too much pressure:</strong> Causes fatigue and can restrict blood flow. Focus on using air support, not force.
                  <br/>
                  <strong>Inconsistent placement:</strong> Mark your mouthpiece position with a permanent marker as a guide.
                  <br/>
                  <strong>Pinched sound:</strong> Relax your embouchure and focus on keeping an open oral cavity, like saying "OH."
                </p>
              </div>
            </div>
          )}
        </section>
        
        <section className="tip-section">
          <h3 
            onClick={() => toggleSection('breathing')} 
            className="section-header"
          >
            Breathing and Air Support {expandedSections['breathing'] ? '▼' : '▶'}
          </h3>
          {expandedSections['breathing'] && (
            <div className="section-content">
              <div className="tip-card">
                <h4>Proper Breathing Technique</h4>
                <p>
                  Breathe from your diaphragm, not your chest. Your shoulders should not rise when you inhale.
                  Take full, deep breaths - fill your lungs from the bottom up.
                  Practice breathing exercises daily to increase lung capacity and control.
                </p>
              </div>
              
              <div className="tip-card">
                <h4>Air Support Exercises</h4>
                <p>
                  <strong>Paper exercise:</strong> Hold a piece of paper against a wall using only your breath.
                  <br/>
                  <strong>Sustained notes:</strong> Practice holding single notes as long as possible with consistent tone.
                  <br/>
                  <strong>Breathing gym:</strong> Inhale for 4 counts, hold for 4, exhale for 4, repeat with increasing counts.
                </p>
              </div>
              
              <div className="tip-card interactive-card">
                <h4>Interactive Breathing Exercise Timer</h4>
                <div className="breathing-exercise">
                  <div className="breathing-display">
                    <div className={`breathing-phase ${breathingExercise.phase}`}>
                      {breathingExercise.phase.toUpperCase()}: {breathingExercise.timeLeft}s
                    </div>
                    <div className="breathing-progress">
                      <div 
                        className={`progress-bar ${breathingExercise.phase}`}
                        style={{
                          width: `${(breathingExercise.timeLeft / breathingExercise.counts[breathingExercise.phase]) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="breathing-controls">
                    <button 
                      className={`breathing-toggle ${breathingExercise.isRunning ? 'stop' : 'start'}`}
                      onClick={toggleBreathingExercise}
                    >
                      {breathingExercise.isRunning ? 'Stop' : 'Start'} Exercise
                    </button>
                    
                    <div className="breathing-settings">
                      <div className="setting">
                        <label>Inhale: {breathingExercise.counts.inhale}s</label>
                        <input 
                          type="range" 
                          min="2" 
                          max="10" 
                          value={breathingExercise.counts.inhale}
                          onChange={(e) => updateBreathingCounts('inhale', parseInt(e.target.value))}
                          disabled={breathingExercise.isRunning}
                        />
                      </div>
                      <div className="setting">
                        <label>Hold: {breathingExercise.counts.hold}s</label>
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={breathingExercise.counts.hold}
                          onChange={(e) => updateBreathingCounts('hold', parseInt(e.target.value))}
                          disabled={breathingExercise.isRunning}
                        />
                      </div>
                      <div className="setting">
                        <label>Exhale: {breathingExercise.counts.exhale}s</label>
                        <input 
                          type="range" 
                          min="2" 
                          max="15" 
                          value={breathingExercise.counts.exhale}
                          onChange={(e) => updateBreathingCounts('exhale', parseInt(e.target.value))}
                          disabled={breathingExercise.isRunning}
                        />
                      </div>
                      <div className="setting">
                        <label>Rest: {breathingExercise.counts.rest}s</label>
                        <input 
                          type="range" 
                          min="1" 
                          max="5" 
                          value={breathingExercise.counts.rest}
                          onChange={(e) => updateBreathingCounts('rest', parseInt(e.target.value))}
                          disabled={breathingExercise.isRunning}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="tip-card">
                <h4>The Importance of Saying "TOO"</h4>
                <p>
                  When starting a note, use a "too" articulation (not "doo" which is too soft or "tah" which is too harsh).
                  This helps create a clean attack at the beginning of your notes.
                  Practice articulation exercises daily, focusing on clarity and consistency.
                </p>
              </div>
            </div>
          )}
        </section>
        
        <section className="tip-section">
          <h3 
            onClick={() => toggleSection('practice')} 
            className="section-header"
          >
            Practice Tips {expandedSections['practice'] ? '▼' : '▶'}
          </h3>
          {expandedSections['practice'] && (
            <div className="section-content">
              <div className="tip-card">
                <h4>Effective Practice Routine</h4>
                <p>
                  <strong>10-15 minutes:</strong> Warm-up (long tones, lip slurs, easy scales)
                  <br/>
                  <strong>10-15 minutes:</strong> Technical exercises (scales, arpeggios, articulation)
                  <br/>
                  <strong>10-15 minutes:</strong> Repertoire (solos, etudes, band music)
                  <br/>
                  <strong>5 minutes:</strong> Cool-down (soft, descending long tones)
                </p>
              </div>
              
              <div className="tip-card interactive-card">
                <h4>Interactive Fingering Chart</h4>
                <div className="fingering-chart">
                  <div className="note-selection">
                    <p>Select a note to see its fingering:</p>
                    <div className="note-buttons">
                      {Object.keys(BEGINNER_TRUMPET_FINGERINGS).map(note => (
                        <button 
                          key={note} 
                          className={`note-button ${selectedNote === note ? 'selected' : ''}`}
                          onClick={() => setSelectedNote(note)}
                        >
                          {note}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="fingering-display">
                    {selectedNote && renderTrumpetFingering(BEGINNER_TRUMPET_FINGERINGS[selectedNote as keyof typeof BEGINNER_TRUMPET_FINGERINGS])}
                    <p className="fingering-caption">
                      Fingering for {selectedNote}: {
                        BEGINNER_TRUMPET_FINGERINGS[selectedNote as keyof typeof BEGINNER_TRUMPET_FINGERINGS].map((val, idx) => 
                          val === 1 ? `Press valve ${idx + 1}` : '').filter(Boolean).join(', ') || 'Open (no valves)'
                      }
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="tip-card">
                <h4>Using a Metronome</h4>
                <p>
                  Practice with a metronome regularly to develop a solid sense of timing.
                  Start slowly and gradually increase speed as you master the exercise.
                  Work on subdivisions by setting the metronome to quarter notes while you play eighth or sixteenth notes.
                </p>
              </div>
              
              <div className="tip-card">
                <h4>Recording Yourself</h4>
                <p>
                  Record your practice sessions regularly to identify areas for improvement.
                  Listen critically but constructively - focus on one aspect at a time.
                  Compare recordings over time to track your progress.
                </p>
              </div>
            </div>
          )}
        </section>
        
        <section className="tip-section">
          <h3 
            onClick={() => toggleSection('problems')} 
            className="section-header"
          >
            Common Beginner Problems and Solutions {expandedSections['problems'] ? '▼' : '▶'}
          </h3>
          {expandedSections['problems'] && (
            <div className="section-content">
              <div className="tip-card">
                <h4>No Sound Coming Out</h4>
                <p>
                  Make sure your lips are vibrating (buzzing) - practice buzzing without the trumpet.
                  Check that you're blowing air through the instrument, not just into it.
                  Ensure valves are properly aligned and not stuck.
                </p>
              </div>
              
              <div className="tip-card">
                <h4>Airy or Unfocused Sound</h4>
                <p>
                  Work on firming your embouchure corners.
                  Focus on directing your air stream through the center of your lips.
                  Check for air leaks around the mouthpiece - ensure it's properly sealed against your lips.
                </p>
              </div>
              
              <div className="tip-card">
                <h4>Difficulty Reaching Higher Notes</h4>
                <p>
                  Practice lip slurs to develop flexibility and range.
                  Focus on increasing air speed, not pressure against the lips.
                  Start with notes you can play comfortably, then gradually work upward.
                </p>
              </div>
              
              <div className="tip-card">
                <h4>Sore Lips or Fatigue</h4>
                <p>
                  Build endurance gradually - don't overplay when starting out.
                  Take frequent breaks during practice sessions.
                  Ensure you're not using excessive pressure against your lips.
                </p>
              </div>
            </div>
          )}
        </section>
        
        <section className="tip-section">
          <h3 
            onClick={() => toggleSection('resources')} 
            className="section-header"
          >
            Recommended Resources {expandedSections['resources'] ? '▼' : '▶'}
          </h3>
          {expandedSections['resources'] && (
            <div className="section-content">
              <div className="tip-card">
                <h4>Method Books</h4>
                <ul>
                  <li>Arban's Complete Conservatory Method for Trumpet</li>
                  <li>Clarke's Technical Studies for the Cornet</li>
                  <li>Rubank Elementary Method for Trumpet</li>
                  <li>Essential Elements for Band: Trumpet Book 1</li>
                </ul>
              </div>
              
              <div className="tip-card">
                <h4>Listening Recommendations</h4>
                <p>
                  Listen to great trumpet players to develop your concept of sound:
                </p>
                <ul>
                  <li>Maurice André (classical)</li>
                  <li>Wynton Marsalis (jazz and classical)</li>
                  <li>Louis Armstrong (jazz)</li>
                  <li>Alison Balsom (classical)</li>
                  <li>Chris Botti (contemporary)</li>
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>
      
      <div className="extra-tips">
        <h3>Quick Tips</h3>
        <ul>
          <li>Always warm up before playing intensely</li>
          <li>Stay relaxed - tension is the enemy of good tone</li>
          <li>Be patient - progress on brass instruments takes time</li>
          <li>Practice consistently - 20 minutes daily is better than 2 hours once a week</li>
          <li>Use our <a href="#/fingering">Fingering Chart</a> and <a href="#/scales">Scales Practice</a> tools to enhance your learning</li>
        </ul>
      </div>
      
      <TimeStamp />
    </div>
  );
};

export default TrumpetTipsPage; 