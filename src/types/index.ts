import { TRUMPET_NOTES_DATA, TrumpetNoteData, getValvesForNote } from '../data/trumpetData';

export type Instrument = 'trumpet' | 'trombone' | 'recorder' | 'ocarina';
export type Clef = 'treble' | 'bass';
export type InstrumentPitch = 'concert' | 'Bb' | 'Eb';

export interface Note {
  name: string;
  octave: number;
  frequency: number;
  midiNote: number;
}

export interface Fingering {
  valves?: number[];  // Optional for trumpet: [1,2,3] where 1=first valve, etc.
  position?: number;  // Optional for trombone: 1-7
  holes?: number[];   // Optional for recorder: array of covered holes [0,1,2,3,4,5,6] where 0=thumb hole
  ocarinaHoles?: number[]; // Optional for ocarina: array of covered holes (1-12)
}

export interface NoteData {
  note: Note;
  fingering: Fingering;
}

// Helper function to calculate note frequency from MIDI note number
const getNoteFrequency = (midiNote: number): number => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

// Helper function to get correct note name from MIDI note
export const getMidiNoteName = (midiNote: number): { name: string, octave: number } => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = noteNames[midiNote % 12];
  return { name: noteName, octave };
};

// Helper function to transpose MIDI note number
const transposeMidiNote = (midiNote: number, pitch: InstrumentPitch): number => {
  // For display purposes, we need the written pitch 
  // (what the player sees on the staff)
  const transpositionMap = {
    'concert': 0,
    'Bb': 2,  // Bb instruments read a major second higher than concert
    'Eb': 9,  // Eb instruments read a minor sixth higher than concert
  };
  return midiNote + transpositionMap[pitch];
};

// Convert the trumpetData to the format expected by the application
export const TRUMPET_NOTES: NoteData[] = TRUMPET_NOTES_DATA.map(note => {
  return {
    note: {
      name: note.name,
      octave: note.octave,
      midiNote: note.midiNote,
      frequency: note.frequency
    },
    fingering: {
      valves: note.valves
    }
  };
}).filter((item, index, self) => 
  // Filter out duplicate notes that have both sharp and flat names
  index === self.findIndex((t) => t.note.midiNote === item.note.midiNote)
);

export const TROMBONE_NOTES: NoteData[] = [
  // Low register (E2 to B2)
  { note: { name: 'E', octave: 2, midiNote: 40, frequency: getNoteFrequency(transposeMidiNote(40, 'concert')) }, fingering: { position: 7 } },
  { note: { name: 'F', octave: 2, midiNote: 41, frequency: getNoteFrequency(transposeMidiNote(41, 'concert')) }, fingering: { position: 6 } },
  { note: { name: 'F#', octave: 2, midiNote: 42, frequency: getNoteFrequency(transposeMidiNote(42, 'concert')) }, fingering: { position: 5 } },
  { note: { name: 'G', octave: 2, midiNote: 43, frequency: getNoteFrequency(transposeMidiNote(43, 'concert')) }, fingering: { position: 4 } },
  { note: { name: 'G#', octave: 2, midiNote: 44, frequency: getNoteFrequency(transposeMidiNote(44, 'concert')) }, fingering: { position: 3 } },
  { note: { name: 'A', octave: 2, midiNote: 45, frequency: getNoteFrequency(transposeMidiNote(45, 'concert')) }, fingering: { position: 2 } },
  { note: { name: 'A#', octave: 2, midiNote: 46, frequency: getNoteFrequency(transposeMidiNote(46, 'concert')) }, fingering: { position: 1 } },
  { note: { name: 'B', octave: 2, midiNote: 47, frequency: getNoteFrequency(transposeMidiNote(47, 'concert')) }, fingering: { position: 1 } },
  // Middle register (C3 to B3)
  { note: { name: 'C', octave: 3, midiNote: 48, frequency: getNoteFrequency(transposeMidiNote(48, 'concert')) }, fingering: { position: 1 } },
  { note: { name: 'C#', octave: 3, midiNote: 49, frequency: getNoteFrequency(transposeMidiNote(49, 'concert')) }, fingering: { position: 7 } },
  { note: { name: 'D', octave: 3, midiNote: 50, frequency: getNoteFrequency(transposeMidiNote(50, 'concert')) }, fingering: { position: 6 } },
  { note: { name: 'D#', octave: 3, midiNote: 51, frequency: getNoteFrequency(transposeMidiNote(51, 'concert')) }, fingering: { position: 5 } },
  { note: { name: 'E', octave: 3, midiNote: 52, frequency: getNoteFrequency(transposeMidiNote(52, 'concert')) }, fingering: { position: 4 } },
  { note: { name: 'F', octave: 3, midiNote: 53, frequency: getNoteFrequency(transposeMidiNote(53, 'concert')) }, fingering: { position: 3 } },
  { note: { name: 'F#', octave: 3, midiNote: 54, frequency: getNoteFrequency(transposeMidiNote(54, 'concert')) }, fingering: { position: 2 } },
  { note: { name: 'G', octave: 3, midiNote: 55, frequency: getNoteFrequency(transposeMidiNote(55, 'concert')) }, fingering: { position: 1 } },
  { note: { name: 'G#', octave: 3, midiNote: 56, frequency: getNoteFrequency(transposeMidiNote(56, 'concert')) }, fingering: { position: 7 } },
  { note: { name: 'A', octave: 3, midiNote: 57, frequency: getNoteFrequency(transposeMidiNote(57, 'concert')) }, fingering: { position: 6 } },
  { note: { name: 'A#', octave: 3, midiNote: 58, frequency: getNoteFrequency(transposeMidiNote(58, 'concert')) }, fingering: { position: 5 } },
  { note: { name: 'B', octave: 3, midiNote: 59, frequency: getNoteFrequency(transposeMidiNote(59, 'concert')) }, fingering: { position: 4 } },
  // High register (C4 to D4)
  { note: { name: 'C', octave: 4, midiNote: 60, frequency: getNoteFrequency(transposeMidiNote(60, 'concert')) }, fingering: { position: 3 } },
  { note: { name: 'C#', octave: 4, midiNote: 61, frequency: getNoteFrequency(transposeMidiNote(61, 'concert')) }, fingering: { position: 2 } },
  { note: { name: 'D', octave: 4, midiNote: 62, frequency: getNoteFrequency(transposeMidiNote(62, 'concert')) }, fingering: { position: 1 } },
];

// Update the RECORDER_NOTES array to start from C4 instead of C5
export const RECORDER_NOTES: NoteData[] = [
  // Soprano Recorder in C (treble clef) - standard range from C4 to D6
  // Low register (C4 to B4)
  { note: { name: 'C', octave: 4, midiNote: 60, frequency: getNoteFrequency(60) }, fingering: { holes: [0, 1, 2, 3, 4, 5, 6] } },
  { note: { name: 'C#', octave: 4, midiNote: 61, frequency: getNoteFrequency(61) }, fingering: { holes: [0, 1, 2, 3, 4, 5] } },
  { note: { name: 'D', octave: 4, midiNote: 62, frequency: getNoteFrequency(62) }, fingering: { holes: [0, 1, 2, 3, 4, 6] } },
  { note: { name: 'D#', octave: 4, midiNote: 63, frequency: getNoteFrequency(63) }, fingering: { holes: [0, 1, 2, 3, 5, 6] } },
  { note: { name: 'E', octave: 4, midiNote: 64, frequency: getNoteFrequency(64) }, fingering: { holes: [0, 1, 2, 3, 5] } },
  { note: { name: 'F', octave: 4, midiNote: 65, frequency: getNoteFrequency(65) }, fingering: { holes: [0, 1, 2, 3] } },
  { note: { name: 'F#', octave: 4, midiNote: 66, frequency: getNoteFrequency(66) }, fingering: { holes: [0, 1, 2, 4, 5, 6] } },
  { note: { name: 'G', octave: 4, midiNote: 67, frequency: getNoteFrequency(67) }, fingering: { holes: [0, 1, 2] } },
  { note: { name: 'G#', octave: 4, midiNote: 68, frequency: getNoteFrequency(68) }, fingering: { holes: [0, 1, 3, 4, 5, 6] } },
  { note: { name: 'A', octave: 4, midiNote: 69, frequency: getNoteFrequency(69) }, fingering: { holes: [0, 1, 2] } },
  { note: { name: 'A#', octave: 4, midiNote: 70, frequency: getNoteFrequency(70) }, fingering: { holes: [0, 1, 4, 5, 6] } },
  { note: { name: 'B', octave: 4, midiNote: 71, frequency: getNoteFrequency(71) }, fingering: { holes: [0, 1] } },
  // Middle register (C5 to B5)
  { note: { name: 'C', octave: 5, midiNote: 72, frequency: getNoteFrequency(72) }, fingering: { holes: [0] } },
  { note: { name: 'C#', octave: 5, midiNote: 73, frequency: getNoteFrequency(73) }, fingering: { holes: [1, 2, 3, 4, 5] } },
  { note: { name: 'D', octave: 5, midiNote: 74, frequency: getNoteFrequency(74) }, fingering: { holes: [1, 2, 3, 4, 6] } },
  { note: { name: 'D#', octave: 5, midiNote: 75, frequency: getNoteFrequency(75) }, fingering: { holes: [1, 2, 3, 5, 6] } },
  { note: { name: 'E', octave: 5, midiNote: 76, frequency: getNoteFrequency(76) }, fingering: { holes: [1, 2, 3, 5] } },
  { note: { name: 'F', octave: 5, midiNote: 77, frequency: getNoteFrequency(77) }, fingering: { holes: [1, 2, 3] } },
  { note: { name: 'F#', octave: 5, midiNote: 78, frequency: getNoteFrequency(78) }, fingering: { holes: [1, 2, 4, 5, 6] } },
  { note: { name: 'G', octave: 5, midiNote: 79, frequency: getNoteFrequency(79) }, fingering: { holes: [1, 2] } },
  { note: { name: 'G#', octave: 5, midiNote: 80, frequency: getNoteFrequency(80) }, fingering: { holes: [1, 3, 4, 5, 6] } },
  { note: { name: 'A', octave: 5, midiNote: 81, frequency: getNoteFrequency(81) }, fingering: { holes: [1, 3] } },
  { note: { name: 'A#', octave: 5, midiNote: 82, frequency: getNoteFrequency(82) }, fingering: { holes: [1, 4, 5, 6] } },
  { note: { name: 'B', octave: 5, midiNote: 83, frequency: getNoteFrequency(83) }, fingering: { holes: [1] } },
  // High register (C6 to D6)
  { note: { name: 'C', octave: 6, midiNote: 84, frequency: getNoteFrequency(84) }, fingering: { holes: [] } },
  { note: { name: 'C#', octave: 6, midiNote: 85, frequency: getNoteFrequency(85) }, fingering: { holes: [2, 3, 4, 5] } },
  { note: { name: 'D', octave: 6, midiNote: 86, frequency: getNoteFrequency(86) }, fingering: { holes: [2, 3, 4, 6] } },
];

export const OCARINA_NOTES: NoteData[] = [
  // Standard 12-hole ocarina in C
  // For consistency with how we'll display the fingerings, update the hole numbering and coverage patterns
  
  // Low register (A4 to G5)
  { note: { name: 'A', octave: 4, midiNote: 69, frequency: getNoteFrequency(69) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] } },
  { note: { name: 'A#', octave: 4, midiNote: 70, frequency: getNoteFrequency(70) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] } },
  { note: { name: 'B', octave: 4, midiNote: 71, frequency: getNoteFrequency(71) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] } },
  { note: { name: 'C', octave: 5, midiNote: 72, frequency: getNoteFrequency(72) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6, 7, 8, 9] } },
  { note: { name: 'C#', octave: 5, midiNote: 73, frequency: getNoteFrequency(73) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6, 7, 8] } },
  { note: { name: 'D', octave: 5, midiNote: 74, frequency: getNoteFrequency(74) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6, 7] } },
  { note: { name: 'D#', octave: 5, midiNote: 75, frequency: getNoteFrequency(75) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6] } },
  { note: { name: 'E', octave: 5, midiNote: 76, frequency: getNoteFrequency(76) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5] } },
  { note: { name: 'F', octave: 5, midiNote: 77, frequency: getNoteFrequency(77) }, fingering: { ocarinaHoles: [1, 2, 3, 4] } },
  { note: { name: 'F#', octave: 5, midiNote: 78, frequency: getNoteFrequency(78) }, fingering: { ocarinaHoles: [1, 2, 3] } },
  { note: { name: 'G', octave: 5, midiNote: 79, frequency: getNoteFrequency(79) }, fingering: { ocarinaHoles: [1, 2] } },
  
  // Middle/high register (G#5 to F6)
  { note: { name: 'G#', octave: 5, midiNote: 80, frequency: getNoteFrequency(80) }, fingering: { ocarinaHoles: [1] } },
  { note: { name: 'A', octave: 5, midiNote: 81, frequency: getNoteFrequency(81) }, fingering: { ocarinaHoles: [] } },
  { note: { name: 'A#', octave: 5, midiNote: 82, frequency: getNoteFrequency(82) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] } }, // Start second octave
  { note: { name: 'B', octave: 5, midiNote: 83, frequency: getNoteFrequency(83) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] } },
  { note: { name: 'C', octave: 6, midiNote: 84, frequency: getNoteFrequency(84) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6, 7, 8] } },
  { note: { name: 'C#', octave: 6, midiNote: 85, frequency: getNoteFrequency(85) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6, 7] } },
  { note: { name: 'D', octave: 6, midiNote: 86, frequency: getNoteFrequency(86) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5, 6] } },
  { note: { name: 'D#', octave: 6, midiNote: 87, frequency: getNoteFrequency(87) }, fingering: { ocarinaHoles: [1, 2, 3, 4, 5] } },
  { note: { name: 'E', octave: 6, midiNote: 88, frequency: getNoteFrequency(88) }, fingering: { ocarinaHoles: [1, 2, 3, 4] } },
  { note: { name: 'F', octave: 6, midiNote: 89, frequency: getNoteFrequency(89) }, fingering: { ocarinaHoles: [1, 2, 3] } },
]; 