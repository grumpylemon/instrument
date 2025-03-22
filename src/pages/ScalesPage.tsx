import React, { useState, useEffect, useRef } from 'react';
import '../App.css';
import MusicalStaff from '../components/MusicalStaff';
import { NoteData, TRUMPET_NOTES, TROMBONE_NOTES, RECORDER_NOTES, OCARINA_NOTES, Instrument, Clef, InstrumentPitch, getMidiNoteName } from '../types';
import { initializeAudio, playNote, stopAllSounds, stopActiveNotes, unlockAudioContext } from '../utils/audioUtils';

// Scale patterns in semitones
const SCALE_PATTERNS = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  blues: [0, 3, 5, 6, 7, 10, 12],
  minorPentatonic: [0, 3, 5, 7, 10, 12],
  majorPentatonic: [0, 2, 4, 7, 9, 12],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  lydian: [0, 2, 4, 6, 7, 9, 11, 12]
};

// Keys for scale selection
const KEYS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Scale names for display
const SCALE_NAMES = {
  major: 'Major Scale',
  minor: 'Minor Scale',
  chromatic: 'Chromatic Scale',
  blues: 'Blues Scale',
  minorPentatonic: 'Minor Pentatonic',
  majorPentatonic: 'Major Pentatonic',
  dorian: 'Dorian Mode',
  mixolydian: 'Mixolydian Mode',
  lydian: 'Lydian Mode'
};

interface ScalesPageProps {}

const ScalesPage: React.FC<ScalesPageProps> = () => {
  // Scale and playback states
  const [scaleType, setScaleType] = useState<keyof typeof SCALE_PATTERNS>('major');
  const [key, setKey] = useState<string>('C');
  const [bpm, setBpm] = useState<number>(120);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [expandedRange, setExpandedRange] = useState<boolean>(false);
  
  // Instrument and audio states
  const [instrument, setInstrument] = useState<Instrument>('trumpet');
  const [clef, setClef] = useState<Clef>('treble');
  const [pitch, setPitch] = useState<InstrumentPitch>('Bb');
  const [volume, setVolume] = useState<number>(0.7);
  const [soundType, setSoundType] = useState<string>('default');
  const [audioInitialized, setAudioInitialized] = useState<boolean>(false);
  const [audioStatus, setAudioStatus] = useState<string>('Click Initialize to enable sound');
  
  // Note display states
  const [scaleNotes, setScaleNotes] = useState<NoteData[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(-1);
  const [selectedNote, setSelectedNote] = useState<NoteData | null>(null);
  
  // References for playback
  const playbackInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Get notes based on selected instrument
  const baseNotes = instrument === 'trumpet' 
    ? TRUMPET_NOTES 
    : (instrument === 'trombone' 
        ? TROMBONE_NOTES 
        : (instrument === 'recorder' ? RECORDER_NOTES : OCARINA_NOTES));
  
  // Initialize audio
  useEffect(() => {
    const initAudio = async () => {
      try {
        await initializeAudio();
        setAudioInitialized(true);
        setAudioStatus('Audio ready');
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        setAudioStatus('Audio initialization failed');
      }
    };
    
    const handleUserInteraction = async () => {
      if (!audioInitialized) {
        await initAudio();
      }
      document.removeEventListener('click', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      stopAllSounds();
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    };
  }, [audioInitialized]);
  
  // Effect to update clef when instrument changes
  useEffect(() => {
    if (instrument === 'trombone') {
      setClef('bass');
    } else {
      setClef('treble');
    }
    
    if (instrument === 'trumpet') {
      setPitch('Bb');
    } else {
      setPitch('concert');
    }
    
    // Stop any playing scale when instrument changes
    stopScale();
  }, [instrument]);
  
  // Effect to generate scale notes when scale type, key, or instrument changes
  useEffect(() => {
    generateScaleNotes();
  }, [scaleType, key, instrument, expandedRange]);
  
  // Function to generate scale notes based on selected parameters
  const generateScaleNotes = () => {
    const keyIndex = KEYS.indexOf(key);
    if (keyIndex === -1) return;
    
    const rootMidiNote = 60 + keyIndex; // C4 (MIDI 60) + semitones for key
    const scalePattern = SCALE_PATTERNS[scaleType];
    
    let allScaleMidiNotes: number[] = [];
    
    if (expandedRange) {
      // Get the lowest and highest MIDI notes available for the current instrument
      const lowestNote = baseNotes.reduce((min, note) => 
        note.note.midiNote < min ? note.note.midiNote : min, 
        Number.MAX_SAFE_INTEGER
      );
      
      const highestNote = baseNotes.reduce((max, note) => 
        note.note.midiNote > max ? note.note.midiNote : max, 
        0
      );
      
      console.log(`Instrument range: ${lowestNote} to ${highestNote}`);
      
      // Generate a wide range of potential scale notes across many octaves
      // First, find how many semitones we need to cover the full range
      const totalRange = highestNote - lowestNote;
      
      // Find a root note that's much lower than the instrument's lowest note
      // to ensure we catch all possible scale tones
      let lowestRoot = rootMidiNote;
      // Go down multiple octaves to ensure we're below the instrument's lowest note
      while (lowestRoot > lowestNote - 24) { // Go at least 2 octaves below the lowest note
        lowestRoot -= 12; // Go down an octave
      }
      
      // Generate notes from the scale pattern across many octaves
      const patternLength = Math.max(...scalePattern); // Typically 12 for one octave
      const possibleNotes: number[] = [];
      
      // Generate enough octaves to cover the entire range plus some extra
      const octavesToGenerate = Math.ceil(totalRange / 12) + 4; // Add more octaves for better coverage
      
      for (let octave = 0; octave < octavesToGenerate; octave++) {
        const octaveRoot = lowestRoot + (octave * 12);
        
        // For C Major scale in key of C, standard pattern is [0,2,4,5,7,9,11,12]
        // This represents [C,D,E,F,G,A,B,C]
        // 
        // We also want to include extended patterns to get notes below the root
        // For example [-5,-3,-1] would give us [G,A,B] below the root C
        
        // Generate the standard pattern for this octave
        const extendedPattern = [...scalePattern];
        
        // Add notes below this octave's root that are part of the scale
        // by including scale tones from the previous octave
        if (octave > 0) {
          // Add notes that would be from the previous octave's pattern
          scalePattern.forEach(semitone => {
            // For each semitone in the pattern, add the equivalent 
            // notes from the octave below (by subtracting 12)
            if (semitone > 0) { // Only add non-root notes
              const belowSemitone = semitone - 12;
              if (!extendedPattern.includes(belowSemitone)) {
                extendedPattern.push(belowSemitone);
              }
            }
          });
          
          // Sort the extended pattern to ensure proper order
          extendedPattern.sort((a, b) => a - b);
        }
        
        // Generate notes using the extended pattern
        extendedPattern.forEach(semitones => {
          const noteValue = octaveRoot + semitones;
          // Don't add duplicates
          if (!possibleNotes.includes(noteValue)) {
            possibleNotes.push(noteValue);
          }
        });
      }
      
      // Filter to only include notes within the instrument's range
      allScaleMidiNotes = possibleNotes
        .filter(note => note >= lowestNote && note <= highestNote)
        .sort((a, b) => a - b); // Sort in ascending order
      
      console.log(`Generated ${allScaleMidiNotes.length} candidate notes across the instrument range`);
      console.log(`Range from ${allScaleMidiNotes[0]} to ${allScaleMidiNotes[allScaleMidiNotes.length-1]}`);
    } else {
      // Standard behavior for single octave
      const octaveNotes = scalePattern.map(semitones => rootMidiNote + semitones);
      allScaleMidiNotes = [...octaveNotes];
    }
    
    // Map MIDI notes to actual note data from our instrument
    const scaleNotesData = allScaleMidiNotes.map(midiNote => {
      // Find the note with the closest MIDI number
      const exactNote = baseNotes.find(note => note.note.midiNote === midiNote);
      if (exactNote) return exactNote;
      
      // If exact note not found, find the closest available note (for instruments with limited range)
      const closestNote = [...baseNotes].sort((a, b) => 
        Math.abs(a.note.midiNote - midiNote) - Math.abs(b.note.midiNote - midiNote)
      )[0];
      
      return closestNote;
    }).filter(Boolean); // Remove any undefined notes
    
    setScaleNotes(scaleNotesData as NoteData[]);
    console.log(`Generated ${scaleNotesData.length} notes for the scale (expanded: ${expandedRange})`);
    
    // Reset current note index
    setCurrentNoteIndex(-1);
    setSelectedNote(null);
  };
  
  // Function to explicitly initialize audio
  const handleInitAudio = async () => {
    setAudioStatus('Initializing audio...');
    try {
      await initializeAudio();
      await unlockAudioContext();
      console.log('Audio context unlocked');
      setAudioInitialized(true);
      setAudioStatus('Audio ready');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setAudioStatus('Audio initialization failed');
    }
  };
  
  // Start playing the scale
  const playScale = () => {
    if (!audioInitialized || scaleNotes.length === 0) {
      setAudioStatus('Please initialize audio first');
      return;
    }
    
    // Stop any currently playing notes
    stopActiveNotes();
    
    // Stop existing playback
    if (playbackInterval.current) {
      clearInterval(playbackInterval.current);
    }
    
    setIsPlaying(true);
    setCurrentNoteIndex(0);
    
    // Calculate note duration based on BPM
    const noteDuration = 60000 / bpm; // in milliseconds
    
    // Play the first note immediately
    const firstNote = scaleNotes[0];
    setSelectedNote(firstNote);
    playNote(instrument, firstNote.note.midiNote, pitch, 0.9, volume, soundType);
    
    // Setup interval for remaining notes
    let noteIndex = 1;
    
    playbackInterval.current = setInterval(() => {
      // Stop the previous note
      stopActiveNotes();
      
      if (noteIndex >= scaleNotes.length) {
        // End of scale
        stopScale();
        return;
      }
      
      // Play the current note
      const currentNote = scaleNotes[noteIndex];
      setSelectedNote(currentNote);
      setCurrentNoteIndex(noteIndex);
      playNote(instrument, currentNote.note.midiNote, pitch, 0.9, volume, soundType);
      
      // Move to next note
      noteIndex++;
    }, noteDuration);
  };
  
  // Stop playing the scale
  const stopScale = () => {
    if (playbackInterval.current) {
      clearInterval(playbackInterval.current);
      playbackInterval.current = null;
    }
    
    stopActiveNotes();
    setIsPlaying(false);
    setCurrentNoteIndex(-1);
    // Don't reset selected note to allow viewing the fingering
  };
  
  // Handle instrument change
  const handleInstrumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newInstrument = e.target.value as Instrument;
    setInstrument(newInstrument);
    stopScale();
  };
  
  // Handle scale type change
  const handleScaleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScaleType(e.target.value as keyof typeof SCALE_PATTERNS);
    stopScale();
  };
  
  // Handle key change
  const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setKey(e.target.value);
    stopScale();
  };
  
  // Handle BPM change
  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value, 10);
    setBpm(newBpm);
    
    // Restart playback if currently playing
    if (isPlaying) {
      stopScale();
      playScale();
    }
  };
  
  // Handle sound type change
  const handleSoundTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSoundType(e.target.value);
  };
  
  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };
  
  // Handle note selection (when user clicks on a note in the staff)
  const handleNoteSelect = (note: NoteData) => {
    // Stop any playing scale
    stopScale();
    
    setSelectedNote(note);
    
    // Play the selected note
    if (audioInitialized) {
      stopActiveNotes();
      playNote(instrument, note.note.midiNote, pitch, 1, volume, soundType);
    }
  };
  
  // Toggle expanded range
  const toggleExpandedRange = () => {
    setExpandedRange(!expandedRange);
    stopScale();
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

  // Render recorder fingering visualization
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

  // Render ocarina fingering
  const renderOcarinaFingering = () => {
    if (!selectedNote || instrument !== 'ocarina') return null;
    
    // Get the fingering for the selected note
    const fingering = selectedNote.fingering;
    const coveredHoles = fingering?.ocarinaHoles || [];
    
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
      </div>
    );
  };
  
  return (
    <div className="page-content">
      <h2 className="page-title">Musical Scales Practice</h2>
      
      <div className="scales-controls">
        <div className="controls-row">
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
            <label htmlFor="scale-type">Scale Type</label>
            <select
              id="scale-type"
              className="control-select"
              value={scaleType}
              onChange={handleScaleTypeChange}
            >
              {Object.entries(SCALE_NAMES).map(([type, name]) => (
                <option key={type} value={type}>{name}</option>
              ))}
            </select>
          </div>
          
          <div className="control-group">
            <label htmlFor="key">Key</label>
            <select
              id="key"
              className="control-select"
              value={key}
              onChange={handleKeyChange}
            >
              {KEYS.map(keyName => (
                <option key={keyName} value={keyName}>{keyName}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="controls-row">
          <div className="control-group">
            <label htmlFor="bpm">Tempo (BPM): {bpm}</label>
            <input
              id="bpm"
              type="range"
              min="40"
              max="240"
              step="4"
              value={bpm}
              onChange={handleBpmChange}
              className="slider"
            />
          </div>
          
          <div className="control-group playback-controls">
            <button
              className={`play-button ${isPlaying ? 'playing' : ''}`}
              onClick={isPlaying ? stopScale : playScale}
              disabled={!audioInitialized || scaleNotes.length === 0}
            >
              {isPlaying ? '⏹ Stop' : '▶ Play Scale'}
            </button>
            
            <button 
              className="init-audio-button"
              onClick={handleInitAudio}
              disabled={audioInitialized}
            >
              {audioInitialized ? '✓ Audio Ready' : '🔊 Initialize Audio'}
            </button>
          </div>
          
          <div className="control-group">
            <button
              className={`expand-button ${expandedRange ? 'expanded' : ''}`}
              onClick={toggleExpandedRange}
            >
              {expandedRange ? 'Single Octave' : 'Full Instrument Range'}
            </button>
          </div>
        </div>
        
        <div className="controls-row audio-settings">
          <div className="control-group">
            <label htmlFor="volume">Volume: {Math.round(volume * 100)}%</label>
            <input
              id="volume"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="slider"
            />
          </div>
          
          <div className="control-group">
            <label htmlFor="sound-type">Sound Style</label>
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
      
      {/* Display current scale information */}
      <div className="scale-info">
        <h3>
          {key} {SCALE_NAMES[scaleType]} {expandedRange ? '(Extended Range)' : ''}
        </h3>
        <p className="scale-status">
          {audioStatus}
          {isPlaying && currentNoteIndex >= 0 && ` • Playing note ${currentNoteIndex + 1} of ${scaleNotes.length}`}
        </p>
      </div>
      
      {/* Fingering display */}
      {selectedNote && (
        <div className="note-info">
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
          
          <h3 className="note-name">
            Current Note: {selectedNote.note.name}{selectedNote.note.octave}
          </h3>
        </div>
      )}
      
      {/* Musical staff to display the scale */}
      {scaleNotes.length > 0 && (
        <MusicalStaff
          clef={clef}
          notes={scaleNotes}
          onNoteSelect={handleNoteSelect}
          selectedNote={selectedNote}
        />
      )}
      
      <div className="scale-instructions">
        <p>
          Click on any note to see its fingering. Use the Play button to hear the scale with correct fingerings.
        </p>
      </div>
    </div>
  );
};

export default ScalesPage; 