import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import '../App.css';
import '../components/styles/keyboard.css';
import MusicalStaff from '../components/MusicalStaff';
import { NoteData, TRUMPET_NOTES, TROMBONE_NOTES, RECORDER_NOTES, OCARINA_NOTES, Instrument, Clef, InstrumentPitch, getMidiNoteName, Fingering } from '../types';
import { initializeAudio, playNote, stopAllSounds, stopActiveNotes, unlockAudioContext, getAudioContext } from '../utils/audioUtils';
import TimeStamp from '../components/TimeStamp';
import '../components/styles/Boomwhacker.css';
import MusicalStaffWrapper from '../components/MusicalStaffWrapper';

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

// Keys for scale selection - include all 15 major keys (both sharps and flats)
const KEYS = [
  'C',                // No sharps/flats
  'D', 'E', 'F', 'G', 'A', 'B',  // Natural keys
  'C#', 'F#',         // Sharp keys
  'Cb', 'Db', 'Eb', 'Gb', 'Ab', 'Bb'  // Flat keys
];

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
  const [audioStatus, setAudioStatus] = useState<string>('Audio not initialized');
  const [colorByDegree, setColorByDegree] = useState<boolean>(false);
  
  // Note display states
  const [scaleNotes, setScaleNotes] = useState<NoteData[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(-1);
  const [selectedNote, setSelectedNote] = useState<NoteData | null>(null);
  const [selectedNoteIndex, setSelectedNoteIndex] = useState<number>(-1);
  
  // References for playback
  const playbackInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Add new state for loading indicator
  const [isAudioLoading, setIsAudioLoading] = useState<boolean>(false);
  
  // Add new state for play direction
  const [playDirection, setPlayDirection] = useState<'forward' | 'backward'>('forward');
  
  // Get notes based on selected instrument
  const baseNotes = instrument === 'trumpet' 
    ? TRUMPET_NOTES 
    : (instrument === 'trombone' 
        ? TROMBONE_NOTES 
        : (instrument === 'recorder' ? RECORDER_NOTES : OCARINA_NOTES));
  
  // Add new state for loading indicator
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
  }, [scaleType, key, instrument, expandedRange, clef]);
  
  // Function to generate scale notes based on selected parameters
  const generateScaleNotes = () => {
    const keyIndex = KEYS.indexOf(key);
    if (keyIndex === -1) return;
    
    // Determine base root note based on clef, instrument and key
    let baseRootNote;
    if (instrument === 'trombone') {
      // For trombone, use exact octaves based on the reference image
      // Based on the trombone scales PDF, match each key signature's correct starting position
      switch (key) {
        case 'C': baseRootNote = 36; break;   // C2 - First line in bass clef
        case 'F': baseRootNote = 41; break;   // F2 - First space in bass clef
        case 'Bb': baseRootNote = 34; break;  // Bb1 - Below bass clef staff
        case 'Eb': baseRootNote = 39; break;  // Eb2 - Top of bass clef staff 
        case 'Ab': baseRootNote = 32; break;  // Ab1 - Below bass clef staff
        case 'Db': baseRootNote = 37; break;  // Db2 - Bottom of bass clef staff
        case 'Gb': baseRootNote = 30; break;  // Gb1 - Below bass clef staff
        case 'B': baseRootNote = 35; break;   // B1 - Below bass clef staff
        case 'E': baseRootNote = 40; break;   // E2 - Bottom of bass clef staff
        case 'A': baseRootNote = 33; break;   // A1 - Below bass clef staff
        case 'D': baseRootNote = 38; break;   // D2 - Bottom of bass clef staff
        case 'G': baseRootNote = 31; break;   // G1 - Below bass clef staff
        default: baseRootNote = 36; break;    // Default to C2
      }
    } else if (instrument === 'trumpet') {
      // For trumpet, carefully place the root note for each key to keep most notes within the staff
      // For C trumpet (concert Bb for a Bb trumpet)
      switch (key) {
        case 'C': baseRootNote = 60; break;   // Middle C (C4)
        case 'G': baseRootNote = 55; break;   // G3
        case 'D': baseRootNote = 50; break;   // D3
        case 'A': baseRootNote = 57; break;   // A3
        case 'E': baseRootNote = 52; break;   // E3
        case 'B': baseRootNote = 59; break;   // B3
        case 'F#': baseRootNote = 54; break;  // F#3
        case 'C#': baseRootNote = 61; break;  // C#4
        case 'F': baseRootNote = 53; break;   // F3
        case 'Bb': baseRootNote = 58; break;  // Bb3
        case 'Eb': baseRootNote = 63; break;  // Eb4
        case 'Ab': baseRootNote = 56; break;  // Ab3
        case 'Db': baseRootNote = 61; break;  // Db4
        case 'Gb': baseRootNote = 54; break;  // Gb3
        case 'Cb': baseRootNote = 59; break;  // Cb4
        default: baseRootNote = 60; break;    // Default to C4
      }
    } else {
      // For other instruments, ensure the notes stay centered in the staff
      // Use a base note that is appropriate for the clef
      if (clef === 'bass') {
        // For bass clef instruments, use F3 as a comfortable center point
        baseRootNote = 53; // F3
      } else {
        // For treble clef instruments, use G4 as a comfortable center point
        baseRootNote = 67; // G4
      }
      
      // Adjust the base root note to match the selected key
      // Find the pitch class of our base center note
      const basePitchClass = baseRootNote % 12;
      // Find the pitch class of the target key
      const keyPitchClass = keyToPitchClass(key);
      // Calculate the semitones to adjust
      const adjustment = (keyPitchClass - basePitchClass + 12) % 12;
      // If the adjustment would push the root too high, drop it an octave
      if (adjustment > 7) {
        baseRootNote = baseRootNote - (12 - adjustment);
      } else {
        baseRootNote = baseRootNote + adjustment;
      }
    }
    
    // For extended range, we'll use the calculated root note
    // For single octave, we want to ensure the scale is centered on the staff
    const rootMidiNote = baseRootNote;
    
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
      
      // If the last note is the same as the first but an octave higher, we may want to keep it
      // However, if we have duplicates in the pattern (some scales might), remove them
      const uniqueNotes = octaveNotes.filter((note, index, array) =>
        array.indexOf(note) === index);
      
      allScaleMidiNotes = [...uniqueNotes];
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
  
  // Helper function to convert key name to pitch class (0-11)
  const keyToPitchClass = (keyName: string): number => {
    const pitchClasses: {[key: string]: number} = {
      'C': 0, 'C#': 1, 'Db': 1,
      'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6,
      'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10,
      'Bb': 10, 'B': 11, 'Cb': 11
    };
    
    return pitchClasses[keyName] || 0;
  };
  
  // Function to explicitly initialize audio
  const handleInitializeAudio = async () => {
    setIsAudioLoading(true);
    try {
      await unlockAudioContext();
      await initializeAudio();
      setAudioInitialized(true);
      setAudioStatus('Audio ready');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setAudioStatus('Audio initialization failed. Try again.');
    } finally {
      setIsAudioLoading(false);
    }
  };
  
  // Modified playScale function to handle both forward and backward playback
  const playScale = async () => {
    if (!audioInitialized || scaleNotes.length === 0) {
      setAudioStatus('Please initialize audio first');
      return;
    }
    
    try {
      // Explicitly unlock audio context before playing
      const audioContext = getAudioContext();
      if (audioContext && audioContext.state !== 'running') {
        await audioContext.resume();
        console.log('Audio context resumed before playback');
      }
      
      // Make sure to unlock with multiple approaches
      await unlockAudioContext();
      
      // Stop any currently playing notes
      stopActiveNotes();
      
      // Stop existing playback
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
      
      setIsPlaying(true);
      
      // Set initial note index based on direction
      // Forward = ascending (low to high) = start at index 0
      // Backward = descending (high to low) = start at last index
      let noteIndex = playDirection === 'forward' ? 0 : scaleNotes.length - 1;
      setCurrentNoteIndex(noteIndex);
      
      // Calculate note duration based on BPM
      const noteDuration = 60000 / bpm; // in milliseconds
      
      // Play the first note immediately
      const firstNote = scaleNotes[noteIndex];
      setSelectedNote(firstNote);
      playNote(instrument, firstNote.note.midiNote, pitch, 0.9, volume, soundType);
      
      // Update index for next note based on direction
      noteIndex = playDirection === 'forward' ? 1 : scaleNotes.length - 2;
      
      playbackInterval.current = setInterval(() => {
        // Stop the previous note
        stopActiveNotes();
        
        // Check if we've reached the end based on direction
        if ((playDirection === 'forward' && noteIndex >= scaleNotes.length) || 
            (playDirection === 'backward' && noteIndex < 0)) {
          // End of scale
          stopScale();
          return;
        }
        
        // Play the current note
        const currentNote = scaleNotes[noteIndex];
        setSelectedNote(currentNote);
        setCurrentNoteIndex(noteIndex);
        playNote(instrument, currentNote.note.midiNote, pitch, 0.9, volume, soundType);
        
        // Move to next note based on direction
        // Forward = increment index (move towards higher notes)
        // Backward = decrement index (move towards lower notes)
        noteIndex = playDirection === 'forward' ? noteIndex + 1 : noteIndex - 1;
      }, noteDuration);
    } catch (error) {
      console.error('Error starting playback:', error);
      setAudioStatus('Error playing scale. Try initializing audio again.');
    }
  };
  
  // Play scale in specific direction
  const playScaleInDirection = (direction: 'forward' | 'backward') => {
    setPlayDirection(direction);
    
    // If already playing, stop current playback
    if (isPlaying) {
      stopScale();
    }
    
    // Small timeout to ensure any cleanup is complete
    setTimeout(() => {
      playScale();
    }, 50);
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
  const handleNoteSelect = async (note: NoteData) => {
    // Stop any playing scale
    stopScale();
    
    setSelectedNote(note);
    
    // Play the selected note
    if (audioInitialized) {
      try {
        // Explicitly unlock audio context before playing
        const audioContext = getAudioContext();
        if (audioContext && audioContext.state !== 'running') {
          await audioContext.resume();
          console.log('Audio context resumed for note selection');
        }
        
        // Make sure to unlock with multiple approaches
        await unlockAudioContext();
        
        stopActiveNotes();
        playNote(instrument, note.note.midiNote, pitch, 1, volume, soundType);
      } catch (error) {
        console.error('Error playing note:', error);
        setAudioStatus('Error playing note. Try initializing audio again.');
      }
    } else {
      setAudioStatus('Please initialize audio first');
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
  
  // Add toggle handler for Boomwhacker Colors
  const toggleColorByDegree = () => {
    setColorByDegree(!colorByDegree);
  };

  // Initial setup of selected note when scale changes
  useEffect(() => {
    if (scaleNotes.length > 0 && selectedNoteIndex === -1) {
      setSelectedNoteIndex(0);
    } else if (scaleNotes.length === 0) {
      setSelectedNoteIndex(-1);
    } else if (selectedNoteIndex >= scaleNotes.length) {
      setSelectedNoteIndex(scaleNotes.length - 1);
    }
  }, [scaleNotes, selectedNoteIndex]);

  const handleNoteClick = (index: number, noteObj: NoteData) => {
    setSelectedNoteIndex(index);
    setSelectedNote(noteObj);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (scaleNotes.length === 0) return;
      
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          if (selectedNoteIndex < scaleNotes.length - 1) {
            const newIndex = selectedNoteIndex + 1;
            setSelectedNoteIndex(newIndex);
            setSelectedNote(scaleNotes[newIndex]);
          }
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          if (selectedNoteIndex > 0) {
            const newIndex = selectedNoteIndex - 1;
            setSelectedNoteIndex(newIndex);
            setSelectedNote(scaleNotes[newIndex]);
          }
          break;
        case 'Home':
          e.preventDefault();
          setSelectedNoteIndex(0);
          setSelectedNote(scaleNotes[0]);
          break;
        case 'End':
          e.preventDefault();
          const lastIndex = scaleNotes.length - 1;
          setSelectedNoteIndex(lastIndex);
          setSelectedNote(scaleNotes[lastIndex]);
          break;
        case ' ':
          e.preventDefault();
          if (audioInitialized && scaleNotes.length > 0) {
            if (isPlaying) {
              stopScale();
            } else {
              playScaleInDirection('forward');
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [scaleNotes, selectedNoteIndex, isPlaying, audioInitialized]);

  // Modify the ScaleNoteDisplay component to highlight the selected note
  const ScaleNoteDisplay = ({ note, index }: { note: NoteData; index: number }) => {
    const isSelected = index === selectedNoteIndex;
    
    // Helper function to format fingering display based on instrument type
    const formatFingering = (fingering: Fingering): string => {
      if (fingering.valves) {
        return fingering.valves.length ? fingering.valves.join(', ') : 'Open';
      } else if (fingering.position !== undefined) {
        return `Position ${fingering.position}`;
      } else if (fingering.holes) {
        return `Holes ${fingering.holes.join(', ')}`;
      } else if (fingering.ocarinaHoles) {
        return `Holes ${fingering.ocarinaHoles.join(', ')}`;
      }
      return '';
    };
    
    return (
      <div 
        className={`scale-note ${isSelected ? 'selected-note' : ''}`}
        style={{ 
          cursor: 'pointer',
          margin: '0 5px',
          padding: '8px',
          borderRadius: '4px',
          border: isSelected ? '2px solid #3a86ff' : '1px solid #ddd',
          backgroundColor: isSelected ? '#e6f0ff' : 'white',
          boxShadow: isSelected ? '0 0 5px rgba(58, 134, 255, 0.5)' : 'none',
          transition: 'all 0.2s ease'
        }}
        onClick={() => handleNoteClick(index, note)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNoteClick(index, note);
          }
        }}
        tabIndex={0}
        title={`${note.note.name} - ${formatFingering(note.fingering)}`}
        role="button"
        aria-pressed={isSelected}
      >
        <div style={{ fontWeight: 'bold' }}>{note.note.name}</div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>
          Fingering: {formatFingering(note.fingering)}
        </div>
      </div>
    );
  };

  // Add visual feedback when a note is playing
  useEffect(() => {
    if (isPlaying && currentNoteIndex >= 0 && currentNoteIndex < scaleNotes.length) {
      setSelectedNoteIndex(currentNoteIndex);
      setSelectedNote(scaleNotes[currentNoteIndex]);
    }
  }, [currentNoteIndex, isPlaying, scaleNotes]);

  return (
    <div className="page-content">
      <h2 className="page-title">Musical Scales Practice</h2>
      
      {/* Add a prominent audio initialization notice if audio isn't initialized */}
      {!audioInitialized && (
        <div className="audio-init-notice" style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '5px',
          margin: '15px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <div>
            <strong>Audio Not Activated</strong> - 
            Browser security requires user interaction before playing audio
          </div>
          <button
            onClick={handleInitializeAudio}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: isAudioLoading ? 'not-allowed' : 'pointer',
              marginLeft: '15px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            disabled={isAudioLoading}
          >
            {isAudioLoading ? (
              <>
                <span className="loading-spinner"></span>
                Initializing...
              </>
            ) : (
              <>🔊 Click to Activate Audio</>
            )}
          </button>
        </div>
      )}
      
      {/* Main Controls - Keep at top */}
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
            <button
              className={`expand-button ${expandedRange ? 'expanded' : ''}`}
              onClick={toggleExpandedRange}
            >
              {expandedRange ? 'Single Octave' : 'Full Instrument Range'}
            </button>
          </div>
          
          <div className="control-group">
            <button
              className={`boomwhacker-button ${colorByDegree ? 'active' : ''}`}
              onClick={toggleColorByDegree}
              title="Color notes by scale degree using the Boomwhacker color system"
            >
              {colorByDegree ? 'Disable Color Coding' : 'Enable Boomwhacker Colors'}
            </button>
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
      
      {/* Fingering display - Moved directly above the musical staff */}
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
        <MusicalStaffWrapper
          title={`${key} ${SCALE_NAMES[scaleType]} Scale`}
          subtitle={`${scaleNotes.length} notes - ${expandedRange ? 'Extended Range' : 'Single Octave'}`}
        >
          <MusicalStaff
            clef={clef}
            notes={scaleNotes}
            onNoteSelect={handleNoteSelect}
            selectedNote={selectedNote}
            rootNote={keyToPitchClass(key) + (clef === 'bass' ? 48 : 60)}
            colorByDegree={colorByDegree}
            keyName={key}
          />
        </MusicalStaffWrapper>
      )}
      
      {/* Scale notes display */}
      <div className="scale-notes-container" style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        gap: '10px',
        marginTop: '20px'
      }}>
        {scaleNotes.map((note, index) => (
          <ScaleNoteDisplay key={index} note={note} index={index} />
        ))}
      </div>
      
      {/* Boomwhacker color legend */}
      {colorByDegree && (
        <div className="boomwhacker-legend">
          <div className="color-item">
            <div className="color-sample color-0"></div>
            <div className="color-label">C (I)</div>
          </div>
          <div className="color-item">
            <div className="color-sample color-2"></div>
            <div className="color-label">D (II)</div>
          </div>
          <div className="color-item">
            <div className="color-sample color-4"></div>
            <div className="color-label">E (III)</div>
          </div>
          <div className="color-item">
            <div className="color-sample color-5"></div>
            <div className="color-label">F (IV)</div>
          </div>
          <div className="color-item">
            <div className="color-sample color-7"></div>
            <div className="color-label">G (V)</div>
          </div>
          <div className="color-item">
            <div className="color-sample color-9"></div>
            <div className="color-label">A (VI)</div>
          </div>
          <div className="color-item">
            <div className="color-sample color-11"></div>
            <div className="color-label">B (VII)</div>
          </div>
        </div>
      )}
      
      {/* Play buttons - Forward and Backward */}
      <div className="play-button-container" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
        <button
          className={`play-button ${isPlaying && playDirection === 'backward' ? 'playing' : ''}`}
          onClick={() => isPlaying ? stopScale() : playScaleInDirection('backward')}
          disabled={!audioInitialized || scaleNotes.length === 0}
          title="Play scale from high to low notes"
          style={{
            backgroundColor: isPlaying && playDirection === 'backward' ? '#e53935' : '#555',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 15px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          {isPlaying && playDirection === 'backward' ? '⏹ Stop' : '◀ Play Descending (high to low)'}
        </button>
        
        <button
          className={`play-button ${isPlaying && playDirection === 'forward' ? 'playing' : ''}`}
          onClick={() => isPlaying ? stopScale() : playScaleInDirection('forward')}
          disabled={!audioInitialized || scaleNotes.length === 0}
          title="Play scale from low to high notes"
          style={{
            backgroundColor: isPlaying && playDirection === 'forward' ? '#e53935' : '#3a86ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 15px',
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          {isPlaying && playDirection === 'forward' ? '⏹ Stop' : '▶ Play Ascending (low to high)'}
        </button>
      </div>
      
      <div className="scale-instructions">
        <p>
          Click on any note to see its fingering. Use the Play buttons to hear the scale with correct fingerings.
          You can also navigate through the scale using the <kbd>←</kbd> and <kbd>→</kbd> arrow keys.
        </p>
        <p style={{ fontSize: '0.85rem', color: '#555' }}>
          <strong>Keyboard shortcuts:</strong> Arrow keys to navigate notes, <kbd>Home</kbd>/<kbd>End</kbd> for first/last note, <kbd>Space</kbd> to play/stop.
        </p>
      </div>
      
      {/* Show current note and playback progress */}
      {isPlaying && (
        <div className="playback-info" style={{
          backgroundColor: '#f0f8ff',
          padding: '10px',
          borderRadius: '4px',
          marginTop: '10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>Playing: </span>
            {playDirection === 'forward' ? 'Ascending' : 'Descending'}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Current Note: </span>
            {currentNoteIndex >= 0 && currentNoteIndex < scaleNotes.length 
              ? scaleNotes[currentNoteIndex].note.name 
              : '-'}
          </div>
          <div>
            <span style={{ fontWeight: 'bold' }}>Note: </span>
            {currentNoteIndex + 1} of {scaleNotes.length}
          </div>
        </div>
      )}
      
      <TimeStamp />
    </div>
  );
};

export default ScalesPage; 