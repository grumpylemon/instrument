export type Instrument = 'trumpet' | 'trombone';
export type Clef = 'treble' | 'bass';

export interface Note {
  name: string;
  octave: number;
  frequency: number;
}

export interface Fingering {
  valves: number[];  // For trumpet: [1,2,3] where 1=first valve, etc.
  position?: number; // For trombone: 1-7
}

export interface NoteData {
  note: Note;
  fingering: Fingering;
}

export const TRUMPET_NOTES: NoteData[] = [
  { note: { name: 'C', octave: 4, frequency: 261.63 }, fingering: { valves: [] } },
  { note: { name: 'D', octave: 4, frequency: 293.66 }, fingering: { valves: [1, 3] } },
  { note: { name: 'E', octave: 4, frequency: 329.63 }, fingering: { valves: [1, 2] } },
  { note: { name: 'F', octave: 4, frequency: 349.23 }, fingering: { valves: [1] } },
  { note: { name: 'G', octave: 4, frequency: 392.00 }, fingering: { valves: [] } },
  { note: { name: 'A', octave: 4, frequency: 440.00 }, fingering: { valves: [1, 2] } },
  { note: { name: 'B', octave: 4, frequency: 493.88 }, fingering: { valves: [2] } },
];

export const TROMBONE_NOTES: NoteData[] = [
  { note: { name: 'E', octave: 2, frequency: 82.41 }, fingering: { position: 7 } },
  { note: { name: 'F', octave: 2, frequency: 87.31 }, fingering: { position: 6 } },
  { note: { name: 'G', octave: 2, frequency: 98.00 }, fingering: { position: 4 } },
  { note: { name: 'A', octave: 2, frequency: 110.00 }, fingering: { position: 2 } },
  { note: { name: 'B', octave: 2, frequency: 123.47 }, fingering: { position: 1 } },
  { note: { name: 'C', octave: 3, frequency: 130.81 }, fingering: { position: 1 } },
]; 