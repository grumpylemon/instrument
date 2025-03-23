import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../App.css';
import './ValveHeroPage.css';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { TRUMPET_NOTES, NoteData } from '../types';
import { playNote, stopActiveNotes, initializeAudio, unlockAudioContext } from '../utils/audioUtils';
import TimeStamp from '../components/TimeStamp';
import { saveHighScore, getHighScores } from '../utils/scoreUtils';
import MusicalStaffWrapper from '../components/MusicalStaffWrapper';
import Button from '../components/ui/button';

// Define difficulty levels for the game
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
type GameLength = 'short' | 'medium' | 'long';

// Difficulty level definitions
const DIFFICULTY_SETTINGS: Record<DifficultyLevel, {
  name: string,
  description: string,
  emoji: string,
  noteRange: [number, number],
  includeAccidentals: boolean
}> = {
  easy: {
    name: 'Easy',
    description: 'Notes in the middle register (G3-C5)',
    emoji: '🌱',
    noteRange: [55, 72], // G3 to C5
    includeAccidentals: false
  },
  medium: {
    name: 'Medium',
    description: 'Notes in the middle and high register (G3-G5)',
    emoji: '🔔',
    noteRange: [55, 79], // G3 to G5
    includeAccidentals: false
  },
  hard: {
    name: 'Hard',
    description: 'Notes in the full normal range (F#3-C6)',
    emoji: '🔥',
    noteRange: [54, 84], // F#3 to C6
    includeAccidentals: true
  },
  expert: {
    name: 'Expert',
    description: 'All notes including pedal tones and extreme high register',
    emoji: '⚡',
    noteRange: [54, 84], // F#3 to C6
    includeAccidentals: true
  }
};

// Game length options
const GAME_LENGTH_OPTIONS: Record<GameLength, {
  name: string,
  value: GameLength,
  description: string,
  emoji: string
}> = {
  short: {
    name: 'Lick',
    value: 'short',
    description: '10 notes',
    emoji: '🔹'
  },
  medium: {
    name: 'Song',
    value: 'medium',
    description: '25 notes',
    emoji: '🔶'
  },
  long: {
    name: 'Symphony',
    value: 'long',
    description: '50 notes',
    emoji: '💎'
  }
};

// Define game length constants
const GAME_LENGTH_NOTES: Record<GameLength, number> = {
  short: 10,
  medium: 25,
  long: 50,
};

// Add the HighScore interface
interface HighScore {
  difficulty: string;
  gameLength: string;
  time: number;
  date: string;
}

// Create an extended NoteData interface
interface GameNoteData extends NoteData {
  correct?: boolean;
  answered?: boolean;
}

interface NoteHistory {
  note: string;
  correct: boolean;
  time: number;
  valves: number[];
  penalty?: number;
}

interface ValveHeroPageProps {}

const ValveHeroPage: React.FC<ValveHeroPageProps> = () => {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'results'>('setup');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [gameLength, setGameLength] = useState<GameLength>('short');
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [isAudioActive, setIsAudioActive] = useState(false);
  
  // Game state
  const [currentNote, setCurrentNote] = useState<GameNoteData | null>(null);
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [selectedValves, setSelectedValves] = useState<number[]>([]);
  const [gameNotes, setGameNotes] = useState<GameNoteData[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [noteHistory, setNoteHistory] = useState<NoteHistory[]>([]);
  const [isHighScore, setIsHighScore] = useState(false);
  const [timePenalty, setTimePenalty] = useState(0);
  
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const osmdContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const staffContainerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  
  // Add the showInstructions state variable
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  
  // Initialize audio
  useEffect(() => {
    const setupAudio = async () => {
      try {
        console.log("Initializing audio...");
        await initializeAudio();
        await unlockAudioContext();
        setIsAudioActive(true);
        console.log("Audio initialized successfully");
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        setIsAudioActive(false);
      }
    };
    
    setupAudio();
    
    // Load high scores from localStorage
    const loadScores = () => {
      try {
        const scores = getHighScores(`valve-hero-${difficulty}-${gameLength}`);
        setHighScores(scores);
        console.log("Loaded high scores:", scores);
      } catch (error) {
        console.error("Error loading high scores:", error);
      }
    };
    
    loadScores();
    
    return () => {
      stopActiveNotes();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Load high scores when difficulty or game length changes
  useEffect(() => {
    try {
      const scores = getHighScores(`valve-hero-${difficulty}-${gameLength}`);
      setHighScores(scores);
    } catch (error) {
      console.error("Error loading high scores for new difficulty/length:", error);
    }
  }, [difficulty, gameLength]);
  
  // Generate notes based on difficulty
  const generateGameNotes = useCallback((): GameNoteData[] => {
    const settings = DIFFICULTY_SETTINGS[difficulty];
    
    // Filter notes based on MIDI range and accidental settings
    let filteredNotes = TRUMPET_NOTES.filter(note => {
      const midiNote = note.note.midiNote;
      const isWithinRange = midiNote >= settings.noteRange[0] && midiNote <= settings.noteRange[1];
      
      // Check if we should include accidentals
      if (!settings.includeAccidentals) {
        const noteName = note.note.name;
        const isNatural = !noteName.includes('#') && !noteName.includes('b');
        return isWithinRange && isNatural;
      }
      
      return isWithinRange;
    });
    
    // For expert difficulty, include all notes
    if (difficulty === 'expert') {
      filteredNotes = TRUMPET_NOTES;
    }
    
    // Randomly select notes for the game
    const gameNotes: GameNoteData[] = [];
    for (let i = 0; i < GAME_LENGTH_NOTES[gameLength]; i++) {
      const randomIndex = Math.floor(Math.random() * filteredNotes.length);
      gameNotes.push({
        ...filteredNotes[randomIndex],
        correct: false,
        answered: false,
      });
    }
    
    return gameNotes;
  }, [difficulty, gameLength]);
  
  // Generate MusicXML for multiple notes
  const generateMusicXML = useCallback((notes: GameNoteData[], currentIndex: number) => {
    // Add measures with 4 notes per measure
    const measuresNeeded = Math.ceil(notes.length / 4);
    let musicXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
      <score-partwise version="3.1">
        <part-list>
          <score-part id="P1">
            <part-name>Trumpet in Bb</part-name>
          </score-part>
        </part-list>
        <part id="P1">
    `;
    
    for (let i = 0; i < measuresNeeded; i++) {
      musicXML += `<measure number="${i + 1}">`;
      
      // Add attributes to the first measure
      if (i === 0) {
        musicXML += `
          <attributes>
            <divisions>1</divisions>
            <key>
              <fifths>0</fifths>
            </key>
            <time>
              <beats>4</beats>
              <beat-type>4</beat-type>
            </time>
            <clef>
              <sign>G</sign>
              <line>2</line>
            </clef>
          </attributes>
        `;
      }
      
      // Add up to 4 notes per measure
      for (let j = 0; j < 4; j++) {
        const noteIndex = i * 4 + j;
        if (noteIndex < notes.length) {
          const note = notes[noteIndex];
          const isCurrentNote = noteIndex === currentIndex;
          
          // Get note step and alter from note name (parse note name correctly)
          const noteName = note.note.name;
          // Get the step - it's the first letter of the name
          const step = noteName.charAt(0).toUpperCase();
          
          // Determine alter value - carefully handling note name format
          let alter = 0;
          if (noteName.includes('#')) alter = 1;
          if (noteName.includes('b')) alter = -1;
          
          // Get octave - it's the last character in the name
          const octave = noteName.match(/\d/)?.[0] || '4';
          
          // Default: all notes start as black (not highlighted yet)
          let noteColor = "black"; 
          
          console.log(`Adding note: ${noteName}, step=${step}, alter=${alter}, octave=${octave}`);
          
          musicXML += `
            <note>
              <pitch>
                <step>${step}</step>
                ${alter !== 0 ? `<alter>${alter}</alter>` : ''}
                <octave>${octave}</octave>
              </pitch>
              <duration>1</duration>
              <type>quarter</type>
              ${isCurrentNote ? `<notations><articulations><accent placement="above"/></articulations></notations>` : ''}
            </note>
          `;
        } else {
          // Add a rest for empty positions
          musicXML += `
            <note>
              <rest/>
              <duration>1</duration>
              <type>quarter</type>
            </note>
          `;
        }
      }
      
      musicXML += `</measure>`;
    }
    
    musicXML += `
        </part>
      </score-partwise>
    `;
    
    console.log("Generated MusicXML:", musicXML);
    return musicXML;
  }, []);
  
  // Display notes using OpenSheetMusicDisplay
  const displayNotes = useCallback((notes: GameNoteData[], currentIndex: number) => {
    console.log("displayNotes called with currentIndex:", currentIndex, "and notes:", notes);
    
    if (!osmdContainerRef.current) {
      console.error("OSMD container ref is null");
      return;
    }
    
    // Initialize OSMD if not already done
    if (!osmdRef.current) {
      console.log("Initializing OSMD with container:", osmdContainerRef.current);
      try {
        // Clear container first to ensure a clean state
        osmdContainerRef.current.innerHTML = '';
        
        osmdRef.current = new OpenSheetMusicDisplay(osmdContainerRef.current);
        osmdRef.current.setOptions({
          followCursor: false,
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawPartNames: false,
          drawMeasureNumbers: false,
          drawTimeSignatures: true,
          drawMetronomeMarks: false,
          backend: "svg",
          autoResize: true
        });
        console.log("OSMD initialized with options");
      } catch (error) {
        console.error("Failed to initialize OSMD:", error);
        return;
      }
    }
    
    if (!osmdRef.current) {
      console.error("OSMD reference is still null after initialization attempt");
      return;
    }
    
    const musicXml = generateMusicXML(notes, currentIndex);
    
    console.log("Loading music XML into OSMD");
    osmdRef.current.load(musicXml).then(() => {
      console.log("Music XML loaded, rendering...");
      if (osmdRef.current) {
        osmdRef.current.render();
        console.log("OSMD rendered");
        
        // After rendering, select the SVG notes and apply CSS classes
        setTimeout(() => {
          if (osmdContainerRef.current) {
            const svg = osmdContainerRef.current.querySelector('svg');
            if (svg) {
              // Find all notehead elements 
              const noteheads = svg.querySelectorAll('.vf-notehead');
              
              console.log(`Found ${noteheads.length} noteheads in SVG`);
              
              // Loop through all notes to apply appropriate styling
              notes.forEach((note, index) => {
                if (index < noteheads.length) {
                  const notehead = noteheads[index];
                  const stem = notehead.parentElement?.querySelector('.vf-stem');
                  
                  // First, remove any existing classes
                  notehead.classList.remove('note-current', 'note-correct', 'note-incorrect');
                  if (stem) stem.classList.remove('note-current', 'note-correct', 'note-incorrect');
                  
                  // Apply appropriate class
                  if (index === currentIndex) {
                    notehead.classList.add('note-current');
                    if (stem) stem.classList.add('note-current');
                  } else if (note.answered) {
                    if (note.correct) {
                      notehead.classList.add('note-correct');
                      if (stem) stem.classList.add('note-correct');
                    } else {
                      notehead.classList.add('note-incorrect');
                      if (stem) stem.classList.add('note-incorrect');
                    }
                  }
                  
                  console.log(`Applied classes to note ${index}: current=${index === currentIndex}, answered=${note.answered}, correct=${note.correct}`);
                }
              });
              
              // Play the current note automatically after rendering
              if (isAudioActive && currentIndex < notes.length) {
                const currentNote = notes[currentIndex];
                console.log("Auto-playing current note:", currentNote.note.name);
                try {
                  playNote('trumpet', currentNote.note.midiNote, 'Bb', 0.5, 0.7, 'default');
                } catch (err) {
                  console.error("Error auto-playing note:", err);
                }
              }
            } else {
              console.error("SVG not found in the OSMD container");
            }
          }
        }, 100); // Small delay to ensure rendering is complete
        
        // Scroll to current note
        if (staffContainerRef.current) {
          const measureWidth = osmdContainerRef.current?.clientWidth ? 
            osmdContainerRef.current.clientWidth / 4 : 200;
          const measureIndex = Math.floor(currentIndex / 4);
          const scrollPosition = measureIndex * measureWidth;
          
          console.log("Scrolling to position:", scrollPosition);
          staffContainerRef.current.scrollLeft = scrollPosition;
        }
      }
    }).catch(error => {
      console.error('Error rendering notes:', error);
      
      // Try to recover by reinitializing OSMD
      if (osmdContainerRef.current) {
        console.log("Attempting to recover by reinitializing OSMD");
        osmdContainerRef.current.innerHTML = '';
        osmdRef.current = null;
        
        // Try again with delay
        setTimeout(() => {
          displayNotes(notes, currentIndex);
        }, 300);
      }
    });
  }, [generateMusicXML, isAudioActive]);
  
  // Start the game
  const startGame = useCallback(() => {
    // Reset OSMD instance and container
    if (osmdRef.current) {
      osmdRef.current = null;
    }
    if (osmdContainerRef.current) {
      osmdContainerRef.current.innerHTML = '';
    }

    const notes = generateGameNotes();
    setGameNotes(notes);
    setCurrentNoteIndex(0);
    setCurrentNote(notes[0]);
    setNoteHistory([]);
    setSelectedValves([]);
    setStartTime(Date.now());
    setCurrentTime(0);
    setTimePenalty(0);
    setGameState('playing');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setCurrentTime(Date.now() - startTime + timePenalty);
    }, 10);
    
    // Ensure the notes are displayed with a slight delay
    // This allows React to finish its rendering cycle before we try to draw the staff
    setTimeout(() => {
      if (notes.length > 0) {
        console.log("Displaying initial notes after game start");
        displayNotes(notes, 0);
      } else {
        console.error("No notes generated for the game");
      }
    }, 200);
  }, [generateGameNotes, displayNotes, startTime, timePenalty]);
  
  // Update the useEffect hook for gameState to display notes when entering the playing state
  useEffect(() => {
    // When the game state changes to 'playing', ensure notes are displayed
    if (gameState === 'playing' && gameNotes.length > 0) {
      console.log("Game state changed to playing, displaying notes");
      displayNotes(gameNotes, currentNoteIndex);
    }
  }, [gameState, gameNotes, currentNoteIndex, displayNotes]);
  
  // Format time display
  const formatTime = (time: number) => {
    const seconds = time / 1000;
    return seconds.toFixed(1); // Show only one decimal place
  };
  
  // Toggle a valve selection
  const toggleValve = (valve: number) => {
    if (selectedValves.includes(valve)) {
      setSelectedValves(selectedValves.filter(v => v !== valve));
    } else {
      setSelectedValves([...selectedValves, valve].sort());
    }
  };
  
  // End the game
  const endGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    const finalTime = Date.now() - startTime + timePenalty;
    setCurrentTime(finalTime);
    
    // Check if it's a high score
    const isNewHighScore = saveHighScore(`valve-hero-${difficulty}-${gameLength}`, {
      difficulty,
      gameLength,
      time: finalTime,
      date: new Date().toISOString(),
    });
    
    setIsHighScore(isNewHighScore);
    
    if (isNewHighScore) {
      const updatedScores = getHighScores(`valve-hero-${difficulty}-${gameLength}`);
      setHighScores(updatedScores);
    }
    
    setGameState('results');
  }, [difficulty, gameLength, startTime, timePenalty]);
  
  // Submit the answer
  const submitAnswer = useCallback(() => {
    if (!currentNote || currentNoteIndex >= gameNotes.length) return;
    
    const isCorrect = JSON.stringify(selectedValves) === JSON.stringify(currentNote.fingering.valves);
    
    // Play the sound of the trumpet with the selected valve combination
    // This will play what the player actually played, not what they should have played
    if (isAudioActive) {
      try {
        // Get note data for the selected valve combination
        // We're simulating what would happen with the selected valve combination
        // For simplicity, if valves are wrong, we still play the current note
        console.log("Playing note based on selected valves:", selectedValves);
        playNote('trumpet', currentNote.note.midiNote, 'Bb', 0.5, 0.7, 'default');
      } catch (err) {
        console.error("Error playing note:", err);
      }
    } else {
      console.log("Audio not active, note not played");
    }
    
    // Update the game notes - mark current note as answered with correct status
    const updatedNotes = [...gameNotes];
    updatedNotes[currentNoteIndex] = {
      ...updatedNotes[currentNoteIndex],
      correct: isCorrect,
      answered: true,
    };
    
    // Log the updated note status
    console.log(`Updated note at index ${currentNoteIndex}:`, {
      note: updatedNotes[currentNoteIndex].note.name,
      answered: updatedNotes[currentNoteIndex].answered,
      correct: updatedNotes[currentNoteIndex].correct
    });
    
    setGameNotes(updatedNotes);
    
    // Apply time penalty for incorrect answers
    let penalty = 0;
    if (!isCorrect) {
      penalty = 5000; // 5 seconds penalty
      setTimePenalty(prevPenalty => prevPenalty + penalty);
    }
    
    // Record the answer
    setNoteHistory([
      ...noteHistory,
      {
        note: currentNote.note.name,
        correct: isCorrect,
        time: Date.now() - startTime + timePenalty,
        valves: selectedValves,
        penalty: isCorrect ? 0 : penalty,
      }
    ]);
    
    // Clear selected valves
    setSelectedValves([]);
    
    // Move to the next note or end game
    const nextIndex = currentNoteIndex + 1;
    if (nextIndex < gameNotes.length) {
      setCurrentNoteIndex(nextIndex);
      setCurrentNote(updatedNotes[nextIndex]);
      
      // Render updated notes with the next note highlighted
      // This will show all answered notes with their correct/incorrect color
      console.log("Displaying updated notes with coloring");
      displayNotes(updatedNotes, nextIndex);
    } else {
      endGame();
    }
  }, [currentNote, currentNoteIndex, gameNotes, selectedValves, startTime, isAudioActive, timePenalty, noteHistory, displayNotes, endGame]);
  
  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;
      
      switch (e.key) {
        case '1':
          toggleValve(0);
          break;
        case '2':
          toggleValve(1);
          break;
        case '3':
          toggleValve(2);
          break;
        case ' ': // Spacebar
          e.preventDefault(); // Prevent page scrolling
          submitAnswer();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState, selectedValves, currentNote, currentNoteIndex, gameNotes, noteHistory, startTime, isAudioActive, submitAnswer]);
  
  // Restart the game
  const restartGame = () => {
    startGame();
  };
  
  // Return to setup
  const returnToSetup = () => {
    // Clean up OSMD
    if (osmdRef.current) {
      osmdRef.current = null;
    }
    if (osmdContainerRef.current) {
      osmdContainerRef.current.innerHTML = '';
    }
    
    setGameState('setup');
  };
  
  // Calculate results
  const calculateResults = () => {
    const correctAnswers = noteHistory.filter(item => item.correct).length;
    const accuracyPercentage = (correctAnswers / noteHistory.length) * 100;
    const totalPenalty = noteHistory.reduce((sum, item) => sum + (item.penalty || 0), 0) / 1000;
    
    return {
      totalTime: currentTime,
      totalNotes: noteHistory.length,
      correctAnswers,
      accuracy: accuracyPercentage.toFixed(1),
      timePenalty: totalPenalty.toFixed(1),
    };
  };
  
  // Activate audio on user interaction
  const activateAudio = async () => {
    try {
      console.log("User triggered audio activation");
      const success = await initializeAudio();
      console.log("Audio initialization result:", success);
      
      await unlockAudioContext();
      console.log("Audio context unlocked");
      
      // Play a silent note to fully activate audio
      const silentNote = await playNote('trumpet', 60, 'Bb', 0.1, 0.01, 'default');
      console.log("Silent note played:", silentNote);
      
      setIsAudioActive(true);
    } catch (error) {
      console.error('Failed to activate audio:', error);
    }
  };
  
  // Render instructions
  const renderInstructions = () => (
    <div className="setup-description">
      <p>Test your knowledge of trumpet valve combinations! Each note requires a specific valve combination - select the correct valves and submit your answer as quickly as possible.</p>
      <p><strong>Note:</strong> Each incorrect answer adds a 5-second penalty to your time.</p>
      <div className="keyboard-shortcuts">
        <h4>How to Play</h4>
        <div className="keyboard-shortcut-list">
          <div className="keyboard-shortcut">
            <div className="key">1</div>
            <span>Press to toggle the 1st valve</span>
          </div>
          <div className="keyboard-shortcut">
            <div className="key">2</div>
            <span>Press to toggle the 2nd valve</span>
          </div>
          <div className="keyboard-shortcut">
            <div className="key">3</div>
            <span>Press to toggle the 3rd valve</span>
          </div>
          <div className="keyboard-shortcut">
            <div className="key">Space</div>
            <span>Submit your answer</span>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Add cleanup for OSMD when component unmounts or returning to setup
  useEffect(() => {
    return () => {
      if (osmdRef.current) {
        console.log("Cleaning up OSMD instance");
        osmdRef.current = null;
      }
      if (osmdContainerRef.current) {
        console.log("Clearing OSMD container");
        osmdContainerRef.current.innerHTML = '';
      }
    };
  }, []);
  
  return (
    <div className="valve-hero-page">
      {gameState === 'setup' && (
        <div className="valve-hero-setup">
          <h2 className="setup-title">Valve Hero</h2>
          
          {renderInstructions()}
          
          <div className="setup-options">
            <div className="option-group">
              <h3>Select Difficulty</h3>
              <div className="option-buttons">
                {Object.entries(DIFFICULTY_SETTINGS).map(([level, settings]) => (
                  <button
                    key={level}
                    className={`option-button ${difficulty === level ? 'selected' : ''}`}
                    onClick={() => setDifficulty(level as DifficultyLevel)}
                  >
                    <span className="option-name">
                      <span className="option-emoji">{settings.emoji}</span> {settings.name}
                    </span>
                    <span className="option-description">{settings.description}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="option-group">
              <h3>Select Game Length</h3>
              <div className="option-buttons">
                {Object.entries(GAME_LENGTH_OPTIONS).map(([length, settings]) => (
                  <button
                    key={length}
                    className={`option-button ${gameLength === length ? 'selected' : ''}`}
                    onClick={() => setGameLength(length as GameLength)}
                  >
                    <span className="option-name">
                      <span className="option-emoji">{settings.emoji}</span> {settings.name}
                    </span>
                    <span className="option-description">{settings.description}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="setup-audio-status">
              <div className={`audio-status ${isAudioActive ? 'active' : ''}`}>
                <div className="indicator"></div>
                {isAudioActive 
                  ? "Audio is ready" 
                  : <span>Audio not initialized. <button onClick={activateAudio}>Activate</button></span>}
              </div>
            </div>
            
            <button 
              className="start-game-button"
              onClick={startGame}
              disabled={!isAudioActive}
            >
              Start Game
            </button>
          </div>
          
          {highScores.length > 0 && (
            <div className="high-scores">
              <h3>Best Times</h3>
              <div className="high-scores-list">
                {highScores.map((score, index) => (
                  <div key={index} className="high-score-entry">
                    <span className="high-score-label">
                      {new Date(score.date).toLocaleDateString()}
                    </span>
                    <span className="high-score-value">{formatTime(score.time)}s</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="game-preview">
            <h3>Game Preview</h3>
            <MusicalStaffWrapper
              title="Sample Notes"
              subtitle="Notes will vary based on difficulty level"
            >
              <div className="osmd-container-preview" ref={previewContainerRef}></div>
            </MusicalStaffWrapper>
            <div className="game-preview-controls">
              <Button onClick={() => setShowInstructions(true)}>How to Play</Button>
            </div>
          </div>
        </div>
      )}
      
      {gameState === 'playing' && currentNote && (
        <div className="valve-hero-game">
          <div className="game-header">
            <div className="game-progress">
              Note {currentNoteIndex + 1} of {gameNotes.length}
            </div>
            <div className="game-timer">
              {formatTime(currentTime)}s
            </div>
          </div>
          
          <div className="game-content">
            <div className="game-status">
              <div className="game-time">Time: {formatTime(currentTime)}s</div>
              <div className="game-progress">
                Note {currentNoteIndex + 1} of {gameNotes.length}
              </div>
            </div>
            
            <MusicalStaffWrapper
              title="Play the Note"
              subtitle={currentNote && currentNote.fingering && currentNote.fingering.valves ? 
                `Press valves ${currentNote.fingering.valves.join('-')} (${currentNote.note.name})` : 
                'Loading...'}
              className="game-staff-wrapper"
            >
              <div 
                className="staff-container"
                ref={staffContainerRef}
              >
                <div 
                  className="osmd-container" 
                  ref={osmdContainerRef}
                ></div>
              </div>
            </MusicalStaffWrapper>
            
            <div className="valve-input">
              <div className="valve-buttons">
                <button
                  className={`valve-button ${selectedValves.includes(0) ? 'pressed' : ''}`}
                  onClick={() => toggleValve(0)}
                >
                  1
                </button>
                <button
                  className={`valve-button ${selectedValves.includes(1) ? 'pressed' : ''}`}
                  onClick={() => toggleValve(1)}
                >
                  2
                </button>
                <button
                  className={`valve-button ${selectedValves.includes(2) ? 'pressed' : ''}`}
                  onClick={() => toggleValve(2)}
                >
                  3
                </button>
              </div>
              
              <button className="submit-answer" onClick={submitAnswer}>
                Submit
              </button>
              
              <div className="keyboard-shortcuts">
                <div className="keyboard-shortcut-list">
                  <div className="keyboard-shortcut">
                    <div className="key">Space</div>
                    <span>Submit your answer</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button className="abort-game" onClick={returnToSetup}>
              Quit Game
            </button>
          </div>
        </div>
      )}
      
      {gameState === 'results' && (
        <div className="valve-hero-results">
          <h2 className="results-title">
            Game Complete!
            {isHighScore && <span className="high-score-badge">New High Score!</span>}
          </h2>
          
          <div className="results-summary">
            {Object.entries(calculateResults()).map(([key, value]) => (
              <div key={key} className="result-item">
                <div className="result-label">
                  {key === 'totalTime' ? 'Time' : 
                   key === 'totalNotes' ? 'Notes' : 
                   key === 'correctAnswers' ? 'Correct' : 
                   key === 'timePenalty' ? 'Penalty' :
                   'Accuracy'}
                </div>
                <div className="result-value">
                  {key === 'totalTime' ? `${formatTime(Number(value))}s` : 
                   key === 'accuracy' ? `${value}%` : 
                   key === 'timePenalty' ? `${value}s` :
                   value}
                </div>
              </div>
            ))}
          </div>
          
          <div className="note-history">
            <h3>Note History</h3>
            <div className="history-list">
              {noteHistory.map((item, index) => (
                <div 
                  key={index} 
                  className={`history-item ${item.correct ? 'correct' : 'incorrect'}`}
                >
                  <span className="history-note">{item.note}</span>
                  <span className="history-result">
                    {item.correct ? '✓' : '✗'}
                  </span>
                  <span className="history-time">
                    {formatTime(item.time - (index > 0 ? noteHistory[index - 1].time : 0))}s
                    {item.penalty ? ` (+${(item.penalty / 1000).toFixed(1)}s)` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="results-actions">
            <button className="play-again" onClick={restartGame}>
              Play Again
            </button>
            <button className="change-settings" onClick={returnToSetup}>
              Change Settings
            </button>
          </div>
          
          <div className="results-notes">
            <MusicalStaffWrapper
              title="Game Notes"
              subtitle="Your performance"
            >
              <div className="osmd-container-results" ref={resultsContainerRef}></div>
            </MusicalStaffWrapper>
          </div>
        </div>
      )}
      <TimeStamp />
      {showInstructions && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>How to Play Valve Hero</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowInstructions(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <ol className="instructions-list">
                <li>A musical note will appear on the staff and play automatically.</li>
                <li>Identify which valve combination is needed to play that note on a trumpet.</li>
                <li>Click the valve buttons (1, 2, 3) or press keyboard keys 1, 2, 3 to select the correct combination.</li>
                <li>Press the <strong>Submit</strong> button or hit <strong>Spacebar</strong> to submit your answer.</li>
                <li>Correct answers will be highlighted in green, incorrect in red.</li>
                <li>Wrong answers add a 5-second penalty to your time.</li>
                <li>Complete all notes as quickly as possible for a high score!</li>
              </ol>
              
              <div className="instructions-tips">
                <h3>Tips:</h3>
                <ul>
                  <li>Some notes can be played with multiple valve combinations. Any correct combination will be accepted.</li>
                  <li>Incorrect answers add a time penalty of 2 seconds.</li>
                  <li>You can use keyboard keys 1, 2, 3 to press valves and Spacebar to submit.</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <Button 
                onClick={() => setShowInstructions(false)}
                variant="primary"
              >
                Got it!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValveHeroPage; 