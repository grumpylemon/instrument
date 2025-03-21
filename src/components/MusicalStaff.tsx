import React from 'react';
import { NoteData } from '../types';

interface MusicalStaffProps {
  clef: 'treble' | 'bass';
  notes: NoteData[];
  onNoteSelect: (note: NoteData) => void;
  selectedNote: NoteData | null;
}

const MusicalStaff: React.FC<MusicalStaffProps> = ({
  clef,
  notes,
  onNoteSelect,
  selectedNote,
}) => {
  return (
    <div className="musical-staff">
      <svg width="600" height="200" viewBox="0 0 600 200">
        {/* Staff lines */}
        {[0, 1, 2, 3, 4].map((line) => (
          <line
            key={line}
            x1="50"
            y1={40 + line * 10}
            x2="550"
            y2={40 + line * 10}
            stroke="black"
            strokeWidth="1"
          />
        ))}

        {/* Clef */}
        <text x="20" y="80" fontSize="60">
          {clef === 'treble' ? '𝄞' : '𝄢'}
        </text>

        {/* Notes */}
        {notes.map((note, index) => {
          const x = 150 + (index * 60);
          const y = 40 + (4 - (note.note.octave - 4)) * 10;
          const isSelected = selectedNote?.note.name === note.note.name;

          return (
            <g
              key={`${note.note.name}${note.note.octave}`}
              onClick={() => onNoteSelect(note)}
              style={{ cursor: 'pointer' }}
            >
              {/* Note head */}
              <circle
                cx={x}
                cy={y}
                r="6"
                fill={isSelected ? '#4CAF50' : 'black'}
                stroke={isSelected ? '#4CAF50' : 'black'}
                strokeWidth="1"
              />
              {/* Stem */}
              <line
                x1={x + 6}
                y1={y - 30}
                x2={x + 6}
                y2={y + 30}
                stroke={isSelected ? '#4CAF50' : 'black'}
                strokeWidth="1"
              />
              {/* Note name */}
              <text
                x={x}
                y={y + 40}
                fontSize="12"
                textAnchor="middle"
                fill={isSelected ? '#4CAF50' : 'black'}
              >
                {note.note.name}{note.note.octave}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default MusicalStaff; 