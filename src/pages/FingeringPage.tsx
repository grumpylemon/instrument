import React, { useState, useEffect, useCallback } from 'react';
import '../App.css';
import MusicalStaff from '../components/MusicalStaff';
import { NoteData, TRUMPET_NOTES, TROMBONE_NOTES, RECORDER_NOTES, OCARINA_NOTES, Instrument, Clef, InstrumentPitch, getMidiNoteName } from '../types';
import { initializeAudio, playNote, stopAllSounds, stopActiveNotes, unlockAudioContext } from '../utils/audioUtils';

interface FingeringPageProps {}

const FingeringPage: React.FC<FingeringPageProps> = () => {
  const [selectedNote, setSelectedNote] = useState<NoteData | null>(null);
  const [instrument, setInstrument] = useState<Instrument>('trumpet');
  const [clef, setClef] = useState<Clef>('treble');
  const [pitch, setPitch] = useState<InstrumentPitch>('Bb');
  const [volume, setVolume] = useState<number>(0.7);
  const [detune, setDetune] = useState<number>(0);
  const [duration, setDuration] = useState<number>(1.5);
  const [audioInitialized, setAudioInitialized] = useState<boolean>(false);
  const [audioStatus, setAudioStatus] = useState<string>('Click Initialize to enable sound');
  const [soundType, setSoundType] = useState<string>('default');
  const [showAudioSettings, setShowAudioSettings] = useState<boolean>(false);
  const [mobileAudioEnabled, setMobileAudioEnabled] = useState<boolean>(false);
  const [advancedPlayer, setAdvancedPlayer] = useState<boolean>(false);

  const extendNotes = (baseNotes: NoteData[]): NoteData[] => {
    if (!baseNotes || baseNotes.length === 0) return baseNotes;
    
    const calcFrequency = (midi: number) => 440 * Math.pow(2, ((midi - 69) / 12));
    
    // Add a full octave below
    const lowerOctaveNotes: NoteData[] = [];
    for (let i = 1; i <= 12; i++) {
      const originalNote = baseNotes.find(note => note.note.midiNote === baseNotes[0].note.midiNote + i - 1);
      if (originalNote) {
        const newMidiNote = originalNote.note.midiNote - 12;
        const newOctave = originalNote.note.octave - 1;
        
        lowerOctaveNotes.push({
          ...originalNote,
          note: {
            ...originalNote.note,
            midiNote: newMidiNote,
            octave: newOctave,
            frequency: calcFrequency(newMidiNote)
          },
          fingering: { ...originalNote.fingering }
        });
      }
    }
    
    // Add a full octave above
    const higherOctaveNotes: NoteData[] = [];
    for (let i = 1; i <= 12; i++) {
      const originalNote = baseNotes.find(note => 
        note.note.midiNote === baseNotes[baseNotes.length - 1].note.midiNote - 12 + i
      );
      if (originalNote) {
        const newMidiNote = originalNote.note.midiNote + 12;
        const newOctave = originalNote.note.octave + 1;
        
        higherOctaveNotes.push({
          ...originalNote,
          note: {
            ...originalNote.note,
            midiNote: newMidiNote,
            octave: newOctave,
            frequency: calcFrequency(newMidiNote)
          },
          fingering: { ...originalNote.fingering }
        });
      }
    }
    
    // Combine all notes in the correct order
    return [...lowerOctaveNotes, ...baseNotes, ...higherOctaveNotes];
  };

  // Get notes based on selected instrument
  const baseNotes = instrument === 'trumpet' 
    ? TRUMPET_NOTES 
    : (instrument === 'trombone' 
        ? TROMBONE_NOTES 
        : (instrument === 'recorder' ? RECORDER_NOTES : OCARINA_NOTES));
  const notes = advancedPlayer ? extendNotes(baseNotes) : baseNotes;

  // Initialize audio on first user interaction
  useEffect(() => {
    const initAudio = async () => {
      if (!audioInitialized) {
        setAudioStatus('Initializing audio...');
        try {
          await initializeAudio();
          setAudioInitialized(true);
          setAudioStatus('Audio ready');
        } catch (error) {
          console.error('Error initializing audio:', error);
          setAudioStatus('Audio initialization failed');
        }
      }
    };

    // Add a click listener to the document to initialize audio on first click
    const handleUserInteraction = async () => {
      await initAudio();
      document.removeEventListener('click', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      // Clean up audio when component unmounts
      stopAllSounds();
    };
  }, [audioInitialized]);

  // Set initial selected note based on clef
  useEffect(() => {
    selectDefaultNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clef, instrument]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        moveToNextNote(1); // Move forward
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        moveToNextNote(-1); // Move backward
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNote, notes]);

  // Function to set default note selection
  const selectDefaultNote = useCallback(() => {
    let defaultMidiNote: number;
    
    if (instrument === 'trumpet') {
      defaultMidiNote = 60; // C4 for trumpet in treble clef
    } else if (instrument === 'trombone') {
      defaultMidiNote = clef === 'treble' ? 60 : 43; // C4 for treble clef, G2 for bass clef
    } else if (instrument === 'recorder') {
      defaultMidiNote = 60; // Recorder - use C4 (MIDI 60) as default, according to reference chart
    } else {
      defaultMidiNote = 60; // Ocarina - use C4 (MIDI 60) as default
    }
    
    const noteToSelect = notes.find(n => n.note.midiNote === defaultMidiNote);
    if (noteToSelect) {
      setSelectedNote(noteToSelect);
    }
  }, [instrument, clef, notes, setSelectedNote]);

  // Function to navigate between notes
  const moveToNextNote = (direction: 1 | -1) => {
    if (!selectedNote || notes.length === 0) return;
    
    // Find the current index
    const currentIndex = notes.findIndex(
      note => note.note.midiNote === selectedNote.note.midiNote
    );
    
    if (currentIndex === -1) return;
    
    // Calculate new index with wrapping
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = notes.length - 1;
    if (newIndex >= notes.length) newIndex = 0;
    
    // Select the new note
    const newNote = notes[newIndex];
    setSelectedNote(newNote);
    
    // Play the note if audio is initialized
    if (audioInitialized) {
      stopActiveNotes();
      playNote(instrument, newNote.note.midiNote, pitch, 1, volume, soundType);
    }
    
    // Highlight the note visually
    highlightNote(newNote.note.midiNote);
  };

  // Helper function to trigger note highlighting
  const highlightNote = (midiNote: number) => {
    // This is a placeholder for any additional highlighting logic
    // The actual highlighting happens in the MusicalStaff component
    console.log(`Highlighting note: ${midiNote}`);
  };

  // Explicitly initialize audio
  const handleInitAudio = async () => {
    try {
      setAudioStatus('Initializing audio...');
      await initializeAudio();
      setAudioInitialized(true);
      setAudioStatus('Audio ready');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setAudioStatus('Audio initialization failed');
    }
  };
  
  // Test audio by playing a middle C
  const handleTestAudio = () => {
    if (audioInitialized) {
      setAudioStatus('Playing test note');
      // Play middle C (MIDI 60) with current volume and sound type
      playNote(instrument, 60, pitch, 1, volume, soundType);
      setTimeout(() => setAudioStatus('Audio ready'), 1000);
    } else {
      setAudioStatus('Please initialize audio first');
    }
  };

  // Enhanced useEffect to unlock audio context
  useEffect(() => {
    console.log('Setting up audio unlocking event listeners');
    const unlockAudio = async () => {
      console.log('Attempting to unlock audio with user interaction');
      try {
        await unlockAudioContext();
        console.log('Audio context resumed.');
      } catch (error) {
        console.error('Error starting audio context:', error);
      }
    };
    document.body.addEventListener('click', unlockAudio, { once: true });
    document.body.addEventListener('touchstart', unlockAudio, { once: true });
    document.body.addEventListener('touchend', unlockAudio, { once: true });
    return () => {
      document.body.removeEventListener('click', unlockAudio);
      document.body.removeEventListener('touchstart', unlockAudio);
      document.body.removeEventListener('touchend', unlockAudio);
    };
  }, []);

  // Update handleNoteSelect to use our audio utility
  const handleNoteSelect = React.useCallback(async (note: NoteData) => {
    console.log('Note selected:', note.note.midiNote, note.note.name, note.note.octave);
    console.log('Instrument:', instrument);
    
    if (instrument === 'ocarina') {
      console.log('Ocarina fingering data:', note.fingering);
      console.log('Ocarina holes:', note.fingering.ocarinaHoles);
    }
    
    setSelectedNote(note);
    if (audioInitialized) {
      try {
        await unlockAudioContext();
        console.log('Audio context resumed in note selection.');
      } catch (e) {
        console.error('Error unlocking audio context:', e);
      }
      stopActiveNotes();
      playNote(instrument, note.note.midiNote, pitch, duration, volume, soundType);
      console.log('Playing note:', note.note.midiNote);
    } else {
      setAudioStatus('Please initialize audio first');
      console.log('Audio not initialized, cannot play note');
    }
  }, [audioInitialized, instrument, pitch, volume, soundType, duration]);

  const handleInstrumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInstrument = e.target.value as Instrument;
    setInstrument(newInstrument);
    
    stopActiveNotes(); // Stop any currently playing notes
    
    // Set appropriate default clef for the instrument
    if (newInstrument === 'trombone') {
      setClef('bass');
      setPitch('concert');
    } else if (newInstrument === 'recorder') {
      setClef('treble');
      setPitch('concert');
    } else if (newInstrument === 'ocarina') {
      setClef('treble');
      setPitch('concert');
      
      // Find a default note for ocarina (we'll use C5, MIDI 72)
      const defaultOcarinaNote = notes.find(note => 
        note.note.midiNote === 72 && note.fingering.ocarinaHoles !== undefined
      );
      
      if (defaultOcarinaNote) {
        console.log('Setting default ocarina note:', defaultOcarinaNote);
        setSelectedNote(defaultOcarinaNote);
      } else {
        console.log('Could not find default ocarina note');
        setSelectedNote(null);
      }
    } else {
      // Trumpet uses treble clef
      setClef('treble');
      setPitch(newInstrument === 'trumpet' ? 'Bb' : 'concert');
    }
  };

  const handleClefChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClef(e.target.value as Clef);
    setSelectedNote(null);
    stopActiveNotes(); // Stop any currently playing notes
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPitch = e.target.value as InstrumentPitch;
    setPitch(newPitch);
    setSelectedNote(null);
    
    // Stop any currently playing notes when changing pitch
    stopActiveNotes();
  };

  // Handle sound type change
  const handleSoundTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSoundType(e.target.value);
    
    // If a note is currently selected, replay it with the new sound type
    if (selectedNote && audioInitialized) {
      // Stop any currently playing notes
      stopActiveNotes();
      // Replay the note with the new sound type
      playNote(instrument, selectedNote.note.midiNote, pitch, 1, volume, e.target.value);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    // If a note is currently selected and playing, update its volume
    if (selectedNote && audioInitialized) {
      // This will stop the current note and replay it with the new volume
      playNote(instrument, selectedNote.note.midiNote, pitch, 1, newVolume, soundType);
    }
  };

  // Toggle audio settings panel
  const toggleAudioSettings = () => {
    console.log("Toggling audio settings, current state:", showAudioSettings);
    setShowAudioSettings(!showAudioSettings);
  };

  // Get note name for display
  const getNoteName = (midiNote: number): string => {
    const noteNames = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];
    const noteName = noteNames[midiNote % 12];
    const octave = Math.floor(midiNote / 12) - 1;
    return `${noteName}${octave}`;
  };
  
  // Get transposed note name based on instrument pitch
  const getTransposedNoteName = (midiNote: number): string => {
    // Apply transposition for display purposes
    let transposedMidi = midiNote;
    if (instrument === 'trumpet') {
      if (pitch === 'Bb') {
        transposedMidi = midiNote + 2; // Bb trumpet sounds 2 semitones lower than written
      } else if (pitch === 'Eb') {
        transposedMidi = midiNote + 9; // Eb trumpet sounds a minor sixth (9 semitones) lower than written
      }
    }
    
    return getNoteName(transposedMidi);
  };

  // Render trumpet valve fingering visualization
  const renderTrumpetFingering = () => {
    if (!selectedNote || instrument !== 'trumpet') return null;
    
    // Get the fingering for the selected note
    const fingering = selectedNote.fingering;
    const valves = fingering?.valves || [];
    
    return (
      <div className="trumpet-fingering">
        <div className="valve-container">
          {[1, 2, 3].map((valveNum) => (
            <div 
              key={valveNum} 
              className={`valve ${valves.includes(valveNum) ? 'pressed' : ''}`}
            >
              {valveNum}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render trombone slide position visualization
  const renderTrombonePosition = () => {
    if (!selectedNote || instrument !== 'trombone') return null;
    
    // Get the position for the selected note
    const position = selectedNote.fingering.position;
    
    if (position === undefined) return null;
    
    return (
      <div className="trombone-position">
        <div className="slide-container">
          <div className="slide-visual">
            <div 
              className="slide-indicator" 
              style={{ 
                left: `${((position - 1) / 6) * 100}%`,
                width: '30px' 
              }}
            ></div>
          </div>
          <div className="position-label">
            Position {position}
          </div>
        </div>
      </div>
    );
  };

  // Keyboard navigation instructions
  const renderKeyboardInstructions = () => (
    <div className="keyboard-instructions">
      <p>Use arrow keys to navigate between notes</p>
      <div className="key-hint">
        <span className="key">←</span> Previous note
        <span className="key">→</span> Next note
      </div>
    </div>
  );

  // Improved mobile detection and audio initialization
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
      window.innerWidth < 768;
  };

  const handleMobileAudioInit = async () => {
    console.log("Initializing mobile audio...");
    try {
      await initializeAudio();
      setAudioInitialized(true);
      setMobileAudioEnabled(true);
      setAudioStatus('Audio ready');
      
      // Play a short test tone to verify audio works
      setTimeout(() => {
        if (audioInitialized) {
          playNote(instrument, 60, pitch, 0.3, volume, soundType); // Middle C test
        }
      }, 100);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setAudioStatus('Audio initialization failed - try again');
    }
  };

  // Add a renderer for recorder fingerings
  const renderRecorderFingering = () => {
    if (!selectedNote || instrument !== 'recorder') return null;
    
    // Get the fingering for the selected note
    const fingering = selectedNote.fingering;
    const holes = fingering?.holes || [];
    
    return (
      <div className="recorder-fingering">
        <div className="recorder-label">Recorder Fingering</div>
        <div className="recorder-body">
          {/* Thumb hole (0) is on the back */}
          <div className={`thumb-hole ${holes.includes(0) ? 'covered' : ''}`} title="Thumb hole">T</div>
          <div className="finger-holes">
            {/* Front holes (1-6) */}
            {[1, 2, 3, 4, 5, 6].map(hole => (
              <div 
                key={hole} 
                className={`finger-hole ${holes.includes(hole) ? 'covered' : ''}`} 
                title={`Hole ${hole}`}
              >
                {hole}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add a renderer for ocarina fingerings
  const renderOcarinaFingering = () => {
    if (!selectedNote || instrument !== 'ocarina') return null;
    
    console.log('Rendering ocarina fingering for note:', selectedNote.note.name, selectedNote.note.octave);
    console.log('Fingering data:', selectedNote.fingering);
    
    // Get the fingering for the selected note
    const fingering = selectedNote.fingering;
    const coveredHoles = fingering?.ocarinaHoles || [];
    
    console.log('Covered holes:', coveredHoles);
    
    // Map numeric hole identifiers to standard ocarina notation
    const standardLabels: Record<number, string> = {
      1: 'T1', // Left thumb
      2: 'T2', // Right thumb
      3: 'L1', // Left index
      4: 'L2', // Left middle
      5: 'L3', // Left ring
      6: 'L4', // Left pinky
      7: 'R1', // Right index
      8: 'R2', // Right middle
      9: 'R3', // Right ring
      10: 'R4', // Right pinky
      11: 'S1', // Sub-hole 1
      12: 'S2'  // Sub-hole 2
    };
    
    return (
      <div className="ocarina-fingering">
        <div className="ocarina-label">Ocarina (12-hole) Fingering</div>
        <div className="ocarina-body">
          {/* Thumb holes (T1, T2) - placed at top */}
          <div className="ocarina-thumb-row">
            {[1, 2].map(hole => (
              <div 
                key={hole} 
                className={`ocarina-hole thumb ${coveredHoles.includes(hole) ? 'covered' : ''}`}
                title={`${standardLabels[hole]} (${hole})`}
              >
                {standardLabels[hole]}
              </div>
            ))}
          </div>
          
          {/* Left hand holes (L1-L4) */}
          <div className="ocarina-hand-section">
            <div className="ocarina-hand left">
              {[3, 4, 5, 6].map(hole => (
                <div 
                  key={hole} 
                  className={`ocarina-hole ${coveredHoles.includes(hole) ? 'covered' : ''}`}
                  title={`${standardLabels[hole]} (${hole})`}
                >
                  {standardLabels[hole]}
                </div>
              ))}
            </div>
            
            {/* Right hand holes (R1-R4) */}
            <div className="ocarina-hand right">
              {[7, 8, 9, 10].map(hole => (
                <div 
                  key={hole} 
                  className={`ocarina-hole ${coveredHoles.includes(hole) ? 'covered' : ''}`}
                  title={`${standardLabels[hole]} (${hole})`}
                >
                  {standardLabels[hole]}
                </div>
              ))}
            </div>
          </div>
          
          {/* Sub-holes (S1, S2) - placed at bottom */}
          <div className="ocarina-subhole-row">
            {[11, 12].map(hole => (
              <div 
                key={hole} 
                className={`ocarina-hole subhole ${coveredHoles.includes(hole) ? 'covered' : ''}`}
                title={`${standardLabels[hole]} (${hole})`}
              >
                {standardLabels[hole]}
              </div>
            ))}
          </div>
        </div>
        
        <div className="ocarina-legend">
          <div>T = Thumb holes</div>
          <div>L = Left hand holes</div>
          <div>R = Right hand holes</div>
          <div>S = Sub-holes</div>
        </div>
      </div>
    );
  };

  return (
    <div className="page-content">
      <h2 className="page-title">Instrument Fingerings</h2>
      
      <div id="tempAudioUnlock" style={{ margin: '10px', padding: '10px', backgroundColor: '#ffd', textAlign: 'center' }}>
        <button onClick={async () => {
          try {
            await unlockAudioContext();
            console.log('Audio context resumed manually via button.');
          } catch (error) {
            console.error('Manual unlock failed:', error);
          }
        }}>
          Unlock Audio (temp)
        </button>
      </div>
      
      {/* Mobile Audio Initialization Overlay */}
      {isMobileDevice() && !mobileAudioEnabled && (
        <div className="mobile-audio-overlay">
          <div className="mobile-audio-prompt">
            <h2>Enable Audio</h2>
            <p>Tap the button below to enable audio on your mobile device</p>
            <button 
              className="mobile-audio-button"
              onClick={handleMobileAudioInit}
            >
              🔊 Enable Sound
            </button>
          </div>
        </div>
      )}
      
      <div className="controls">
        <div className="control-group">
          <label htmlFor="instrument">
            {instrument === 'trumpet' ? '🎺' : instrument === 'trombone' ? '🎷' : instrument === 'recorder' ? '🎹' : '🏺'} Instrument
          </label>
          <select
            id="instrument"
            className="control-select"
            value={instrument}
            onChange={handleInstrumentChange}
          >
            <option value="trumpet">Trumpet</option>
            <option value="trombone">Trombone</option>
            <option value="recorder">Recorder</option>
            <option value="ocarina">Ocarina</option>
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="clef">
            🎵 Clef
          </label>
          <select
            id="clef"
            className="control-select"
            value={clef}
            onChange={handleClefChange}
          >
            <option value="treble">Treble Clef</option>
            <option value="bass">Bass Clef</option>
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="pitch">
            🔊 Pitch
          </label>
          <select
            id="pitch"
            className="control-select"
            value={pitch}
            onChange={handlePitchChange}
          >
            <option value="concert">Concert Pitch (C)</option>
            <option value="Bb">Bb</option>
            <option value="Eb">Eb</option>
          </select>
        </div>
        
        <div className="control-group">
          <button
            className="advanced-player-toggle"
            onClick={() => setAdvancedPlayer(!advancedPlayer)}
          >
            {advancedPlayer ? "Standard Player" : "Advanced Player"}
          </button>
        </div>
        
        <div className="control-group">
          <button 
            className="audio-settings-toggle"
            onClick={toggleAudioSettings}
            aria-label={showAudioSettings ? "Hide Audio Settings" : "Show Audio Settings"}
          >
            {showAudioSettings ? "Hide Audio Settings" : "Audio Settings"}
          </button>
        </div>
      </div>

      {/* Fix audio settings panel visibility */}
      {showAudioSettings && (
        <div className="audio-settings-panel" style={{ position: 'relative', right: 0 }}>
          <div className="audio-controls-row">
            <div className="audio-status-container">
              <div className={`audio-status ${audioInitialized ? 'active' : ''}`}>
                <div className="indicator"></div>
                <span>{audioStatus}</span>
              </div>
              
              <div className="audio-buttons">
                <button 
                  onClick={handleInitAudio} 
                  disabled={audioInitialized}
                  className="audio-button"
                >
                  Initialize Audio
                </button>
                <button 
                  onClick={handleTestAudio} 
                  disabled={!audioInitialized}
                  className="audio-button"
                >
                  Test Sound
                </button>
              </div>
            </div>
            
            <div className="audio-controls-divider"></div>
            
            <div className="sound-controls">
              <div className="volume-control">
                <label htmlFor="volume-slider">Volume: {Math.round(volume * 100)}%</label>
                <input
                  id="volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>
              
              <div className="sound-type-control">
                <label htmlFor="sound-type">Sound Style:</label>
                <select
                  id="sound-type"
                  className="control-select"
                  value={soundType}
                  onChange={handleSoundTypeChange}
                >
                  <option value="default">Default</option>
                  <option value="bright">Bright</option>
                  <option value="mellow">Mellow</option>
                  <option value="brilliant">Brilliant</option>
                  <option value="warm">Warm</option>
                  <option value="piano">Piano</option>
                  <option value="synth">Synth</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedNote && (
        <div className="note-info">
          {/* Fingering display moved to the top for better visibility */}
          <div className="fingering-display">
            <div className="fingering-label">
              {instrument === 'trumpet' 
                ? 'Trumpet Valve Fingering' 
                : (instrument === 'trombone' 
                  ? 'Trombone Slide Position' 
                  : (instrument === 'recorder'
                    ? 'Recorder Fingering'
                    : 'Ocarina Fingering'))}
            </div>
            
            {instrument === 'trumpet' && renderTrumpetFingering()}
            {instrument === 'trombone' && renderTrombonePosition()}
            {instrument === 'recorder' && renderRecorderFingering()}
            {instrument === 'ocarina' && renderOcarinaFingering()}
          </div>
          
          <h2 className="note-name">
            Selected Note: {
              (() => {
                // Display logic for note name
                const midiNote = selectedNote.note.midiNote;
                let displayName = selectedNote.note.name;
                let displayOctave = selectedNote.note.octave;
                
                if (instrument === 'trumpet' && pitch === 'concert') {
                  const concertMidi = midiNote - 2;
                  const concertNote = getMidiNoteName(concertMidi);
                  displayName = concertNote.name;
                  displayOctave = concertNote.octave;
                } else if (instrument === 'trumpet' && pitch === 'Eb') {
                  const ebMidi = midiNote + 7;
                  const ebNote = getMidiNoteName(ebMidi);
                  displayName = ebNote.name;
                  displayOctave = ebNote.octave;
                }
                
                return `${displayName}${displayOctave}`;
              })()
            }
          </h2>
          
          <div className="midi-info">
            <p>MIDI: {selectedNote.note.midiNote}</p>
            <p>Frequency: {selectedNote.note.frequency.toFixed(2)} Hz</p>
          </div>
        </div>
      )}

      <MusicalStaff
        clef={clef}
        notes={notes}
        onNoteSelect={handleNoteSelect}
        selectedNote={selectedNote}
      />
      
      {!selectedNote && (
        <div className="note-click-helper">
          Click on any note or the number below it to select
        </div>
      )}
      
      {renderKeyboardInstructions()}
    </div>
  );
};

export default FingeringPage; 