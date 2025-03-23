/**
 * Comprehensive trumpet data - single source of truth for the application
 * Based on standard trumpet fingering chart
 * 
 * Format:
 * - midiNote: MIDI note number
 * - name: Note name with accidental (# for sharp, b for flat)
 * - octave: Octave number (scientific pitch notation)
 * - frequency: Frequency in Hz
 * - valves: Array of valve numbers (0-indexed, [0]=1st valve, [1]=2nd valve, [2]=3rd valve)
 * - register: Which register the note belongs to
 */

interface TrumpetNoteData {
  midiNote: number;
  name: string;
  octave: number;
  fullName: string; // Combined name+octave
  frequency: number;
  valves: number[];
  register: 'pedal' | 'low' | 'middle' | 'high' | 'very high';
}

// Helper to calculate frequency from MIDI note number (A4 = 69 = 440Hz)
const midiToFrequency = (midi: number): number => {
  return 440 * Math.pow(2, (midi - 69) / 12);
};

// Helper to create the full note name
const getFullName = (name: string, octave: number): string => {
  return `${name}${octave}`;
};

// Comprehensive trumpet note data with accurate fingerings
// This is based on the standard Bb trumpet
export const TRUMPET_NOTES_DATA: TrumpetNoteData[] = [
  // Low Register (Below the staff)
  { midiNote: 54, name: 'F#', octave: 3, fullName: 'F#3', frequency: midiToFrequency(54), valves: [0, 1], register: 'low' },
  { midiNote: 55, name: 'G', octave: 3, fullName: 'G3', frequency: midiToFrequency(55), valves: [], register: 'low' }, // Open
  { midiNote: 56, name: 'G#', octave: 3, fullName: 'G#3', frequency: midiToFrequency(56), valves: [1], register: 'low' },
  { midiNote: 56, name: 'Ab', octave: 3, fullName: 'Ab3', frequency: midiToFrequency(56), valves: [1], register: 'low' },
  { midiNote: 57, name: 'A', octave: 3, fullName: 'A3', frequency: midiToFrequency(57), valves: [0, 1], register: 'low' },
  { midiNote: 58, name: 'A#', octave: 3, fullName: 'A#3', frequency: midiToFrequency(58), valves: [0], register: 'low' },
  { midiNote: 58, name: 'Bb', octave: 3, fullName: 'Bb3', frequency: midiToFrequency(58), valves: [0], register: 'low' },
  { midiNote: 59, name: 'B', octave: 3, fullName: 'B3', frequency: midiToFrequency(59), valves: [0, 1], register: 'low' },
  
  // Middle Register (First octave on the staff)
  { midiNote: 60, name: 'C', octave: 4, fullName: 'C4', frequency: midiToFrequency(60), valves: [], register: 'middle' }, // Open
  { midiNote: 61, name: 'C#', octave: 4, fullName: 'C#4', frequency: midiToFrequency(61), valves: [0, 1], register: 'middle' },
  { midiNote: 61, name: 'Db', octave: 4, fullName: 'Db4', frequency: midiToFrequency(61), valves: [0, 1], register: 'middle' },
  { midiNote: 62, name: 'D', octave: 4, fullName: 'D4', frequency: midiToFrequency(62), valves: [0], register: 'middle' },
  { midiNote: 63, name: 'D#', octave: 4, fullName: 'D#4', frequency: midiToFrequency(63), valves: [0, 1], register: 'middle' },
  { midiNote: 63, name: 'Eb', octave: 4, fullName: 'Eb4', frequency: midiToFrequency(63), valves: [0, 1], register: 'middle' },
  { midiNote: 64, name: 'E', octave: 4, fullName: 'E4', frequency: midiToFrequency(64), valves: [0, 1], register: 'middle' },
  { midiNote: 65, name: 'F', octave: 4, fullName: 'F4', frequency: midiToFrequency(65), valves: [0], register: 'middle' },
  { midiNote: 66, name: 'F#', octave: 4, fullName: 'F#4', frequency: midiToFrequency(66), valves: [0, 1], register: 'middle' },
  { midiNote: 67, name: 'G', octave: 4, fullName: 'G4', frequency: midiToFrequency(67), valves: [], register: 'middle' }, // Open
  { midiNote: 68, name: 'G#', octave: 4, fullName: 'G#4', frequency: midiToFrequency(68), valves: [1], register: 'middle' },
  { midiNote: 68, name: 'Ab', octave: 4, fullName: 'Ab4', frequency: midiToFrequency(68), valves: [1], register: 'middle' },
  { midiNote: 69, name: 'A', octave: 4, fullName: 'A4', frequency: midiToFrequency(69), valves: [0, 1], register: 'middle' },
  { midiNote: 70, name: 'A#', octave: 4, fullName: 'A#4', frequency: midiToFrequency(70), valves: [0], register: 'middle' },
  { midiNote: 70, name: 'Bb', octave: 4, fullName: 'Bb4', frequency: midiToFrequency(70), valves: [0], register: 'middle' },
  { midiNote: 71, name: 'B', octave: 4, fullName: 'B4', frequency: midiToFrequency(71), valves: [1, 2], register: 'middle' },
  
  // Upper Middle Register (Second octave on the staff)
  { midiNote: 72, name: 'C', octave: 5, fullName: 'C5', frequency: midiToFrequency(72), valves: [], register: 'middle' }, // Open
  { midiNote: 73, name: 'C#', octave: 5, fullName: 'C#5', frequency: midiToFrequency(73), valves: [0, 1], register: 'middle' },
  { midiNote: 73, name: 'Db', octave: 5, fullName: 'Db5', frequency: midiToFrequency(73), valves: [0, 1], register: 'middle' },
  { midiNote: 74, name: 'D', octave: 5, fullName: 'D5', frequency: midiToFrequency(74), valves: [0], register: 'middle' },
  { midiNote: 75, name: 'D#', octave: 5, fullName: 'D#5', frequency: midiToFrequency(75), valves: [0, 1], register: 'middle' },
  { midiNote: 75, name: 'Eb', octave: 5, fullName: 'Eb5', frequency: midiToFrequency(75), valves: [0, 1], register: 'middle' },
  { midiNote: 76, name: 'E', octave: 5, fullName: 'E5', frequency: midiToFrequency(76), valves: [0, 1], register: 'middle' },
  { midiNote: 77, name: 'F', octave: 5, fullName: 'F5', frequency: midiToFrequency(77), valves: [0], register: 'high' },
  { midiNote: 78, name: 'F#', octave: 5, fullName: 'F#5', frequency: midiToFrequency(78), valves: [0, 1], register: 'high' },
  { midiNote: 79, name: 'G', octave: 5, fullName: 'G5', frequency: midiToFrequency(79), valves: [], register: 'high' }, // Open
  { midiNote: 80, name: 'G#', octave: 5, fullName: 'G#5', frequency: midiToFrequency(80), valves: [1], register: 'high' },
  { midiNote: 80, name: 'Ab', octave: 5, fullName: 'Ab5', frequency: midiToFrequency(80), valves: [1], register: 'high' },
  { midiNote: 81, name: 'A', octave: 5, fullName: 'A5', frequency: midiToFrequency(81), valves: [0, 1], register: 'high' },
  { midiNote: 82, name: 'A#', octave: 5, fullName: 'A#5', frequency: midiToFrequency(82), valves: [0], register: 'high' },
  { midiNote: 82, name: 'Bb', octave: 5, fullName: 'Bb5', frequency: midiToFrequency(82), valves: [0], register: 'high' },
  { midiNote: 83, name: 'B', octave: 5, fullName: 'B5', frequency: midiToFrequency(83), valves: [1, 2], register: 'high' },
  
  // High Register (Above the staff)
  { midiNote: 84, name: 'C', octave: 6, fullName: 'C6', frequency: midiToFrequency(84), valves: [], register: 'high' }, // Open
  { midiNote: 85, name: 'C#', octave: 6, fullName: 'C#6', frequency: midiToFrequency(85), valves: [0, 1], register: 'very high' },
  { midiNote: 85, name: 'Db', octave: 6, fullName: 'Db6', frequency: midiToFrequency(85), valves: [0, 1], register: 'very high' },
  { midiNote: 86, name: 'D', octave: 6, fullName: 'D6', frequency: midiToFrequency(86), valves: [0], register: 'very high' },
  { midiNote: 87, name: 'D#', octave: 6, fullName: 'D#6', frequency: midiToFrequency(87), valves: [0, 1], register: 'very high' },
  { midiNote: 87, name: 'Eb', octave: 6, fullName: 'Eb6', frequency: midiToFrequency(87), valves: [0, 1], register: 'very high' },
  { midiNote: 88, name: 'E', octave: 6, fullName: 'E6', frequency: midiToFrequency(88), valves: [0, 1], register: 'very high' },
  { midiNote: 89, name: 'F', octave: 6, fullName: 'F6', frequency: midiToFrequency(89), valves: [0], register: 'very high' },
  { midiNote: 90, name: 'F#', octave: 6, fullName: 'F#6', frequency: midiToFrequency(90), valves: [0, 1], register: 'very high' },
  { midiNote: 91, name: 'G', octave: 6, fullName: 'G6', frequency: midiToFrequency(91), valves: [], register: 'very high' }, // Open
];

// Exporting alternative fingerings for advanced players
// These are alternative fingerings that can be used for certain notes
export const TRUMPET_ALTERNATIVE_FINGERINGS = {
  'F#3': [[0, 1], [1, 2]],     // F#3/Gb3 can be played with 1-2 or 2-3
  'G#3': [[1], [0, 1, 2]],    // G#3/Ab3 can be played with 2 or 1-2-3
  'A3': [[0, 1], [1, 2]],     // A3 can be played with 1-2 or 2-3
  'B3': [[0, 1], [1, 2]],     // B3 can be played with 1-2 or 2-3 (in some contexts)
  'F#4': [[0, 1], [1, 2]],    // F#4/Gb4 can be played with 1-2 or 2-3
  'G#4': [[1], [0, 1, 2]],    // G#4/Ab4 can be played with 2 or 1-2-3
  'A4': [[0, 1], [1, 2]],     // A4 can be played with 1-2 or 2-3
  'B4': [[1, 2], [0, 2]],     // B4 can be played with 2-3 or 1-3 (depending on intonation needed)
};

// Export the interface for type checking
export type { TrumpetNoteData };

// Export a function to get the primary valve combination for a note
export const getValvesForNote = (noteName: string, octave: number): number[] => {
  const fullName = `${noteName}${octave}`;
  const foundNote = TRUMPET_NOTES_DATA.find(note => note.fullName === fullName);
  return foundNote ? foundNote.valves : [];
};

// Export a function to get all possible valve combinations for a note (including alternatives)
export const getAllValveCombinationsForNote = (noteName: string, octave: number): number[][] => {
  const fullName = `${noteName}${octave}`;
  const primaryValves = getValvesForNote(noteName, octave);
  
  const alternatives = TRUMPET_ALTERNATIVE_FINGERINGS[fullName as keyof typeof TRUMPET_ALTERNATIVE_FINGERINGS];
  
  if (alternatives) {
    return [primaryValves, ...alternatives];
  }
  
  return [primaryValves];
};

// Find a note by MIDI number
export const getTrumpetNoteByMidi = (midiNote: number, preferredAccidental?: 'sharp' | 'flat'): TrumpetNoteData | undefined => {
  // Get all matching notes
  const matchingNotes = TRUMPET_NOTES_DATA.filter(note => note.midiNote === midiNote);
  
  if (matchingNotes.length === 0) {
    return undefined;
  }
  
  if (matchingNotes.length === 1) {
    return matchingNotes[0];
  }
  
  // If we have preferences for accidentals
  if (preferredAccidental === 'sharp') {
    return matchingNotes.find(note => note.name.includes('#')) || matchingNotes[0];
  } else if (preferredAccidental === 'flat') {
    return matchingNotes.find(note => note.name.includes('b')) || matchingNotes[0];
  }
  
  // Default return the first match
  return matchingNotes[0];
}; 