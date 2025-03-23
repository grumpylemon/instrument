import React, { useEffect, useRef, useCallback, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { NoteData, Clef } from '../types';
import debounce from 'lodash/debounce';
import '../App.css';

// Boomwhacker color map for scale degrees
const DEGREE_COLORS: { [degree: number]: string } = {
  0: "#FF0000",  // C - Red (I)
  2: "#FFA500",  // D - Orange (II)
  4: "#FFFF00",  // E - Yellow (III)
  5: "#00FF00",  // F - Green (IV)
  7: "#0000FF",  // G - Blue (V)
  9: "#800080",  // A - Purple (VI)
  11: "#FFC0CB"  // B - Pink (VII)
};

// Debounce utility to prevent rapid multiple clicks
// const debounce = (func: Function, delay: number) => {
//   let timerId: number | null = null;
//   return (...args: any[]) => {
//     if (timerId) {
//       clearTimeout(timerId);
//     }
//     timerId = window.setTimeout(() => {
//       func(...args);
//       timerId = null;
//     }, delay);
//   };
// };

interface MusicalStaffProps {
  clef: Clef;
  notes: NoteData[];
  onNoteSelect: (note: NoteData) => void;
  selectedNote: NoteData | null;
  rootNote?: number; // Optional MIDI number of the root note for scale highlighting
  colorByDegree?: boolean; // Optional prop to enable Boomwhacker coloring
  keyName?: string; // The key name (e.g., 'C', 'F#', 'Bb') for determining key signature
}

const MusicalStaff: React.FC<MusicalStaffProps> = ({ 
  clef, 
  notes, 
  onNoteSelect, 
  selectedNote, 
  rootNote, 
  colorByDegree,
  keyName = 'C' // Default to C if not provided
}) => {
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastClickedElementRef = useRef<string | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const handleClickRef = React.useRef<((e: MouseEvent) => void) | null>(null) as React.MutableRefObject<((e: MouseEvent) => void) | null>;
  const [hasRendered, setHasRendered] = useState(false);
  
  // Helper function to get key signature in fifths based on key name
  const getKeySignatureByName = (keyName: string): number => {
    // Map key names directly to fifths
    const keyNameToFifths: {[key: string]: number} = {
      'C': 0,     // No sharps or flats
      'G': 1,     // 1 sharp (F#)
      'D': 2,     // 2 sharps (F#, C#)
      'A': 3,     // 3 sharps (F#, C#, G#)
      'E': 4,     // 4 sharps (F#, C#, G#, D#)
      'B': 5,     // 5 sharps (F#, C#, G#, D#, A#)
      'F#': 6,    // 6 sharps (F#, C#, G#, D#, A#, E#)
      'C#': 7,    // 7 sharps (F#, C#, G#, D#, A#, E#, B#)
      'F': -1,    // 1 flat (Bb)
      'Bb': -2,   // 2 flats (Bb, Eb)
      'Eb': -3,   // 3 flats (Bb, Eb, Ab)
      'Ab': -4,   // 4 flats (Bb, Eb, Ab, Db)
      'Db': -5,   // 5 flats (Bb, Eb, Ab, Db, Gb)
      'Gb': -6,   // 6 flats (Bb, Eb, Ab, Db, Gb, Cb)
      'Cb': -7    // 7 flats (Bb, Eb, Ab, Db, Gb, Cb, Fb)
    };
    
    return keyNameToFifths[keyName] || 0; // Default to C major (0 fifths) if not found
  };

  // Helper function to get key signature in fifths based on root note MIDI value
  const getKeySignatureFifths = (rootMidiNote: number): number => {
    // Get the pitch class (0-11) of the root note
    const pitchClass = rootMidiNote % 12;
    
    // Map pitch classes to fifths for key signatures
    // C = 0 fifths, G = 1 fifth, D = 2 fifths, etc.
    // F = -1 fifth, Bb = -2 fifths, Eb = -3 fifths, etc.
    const pitchClassToFifths: {[key: number]: number} = {
      0: 0,    // C major: no sharps or flats
      7: 1,    // G major: 1 sharp (F#)
      2: 2,    // D major: 2 sharps (F#, C#)
      9: 3,    // A major: 3 sharps (F#, C#, G#)
      4: 4,    // E major: 4 sharps (F#, C#, G#, D#)
      11: 5,   // B major: 5 sharps (F#, C#, G#, D#, A#)
      5: -1,   // F major: 1 flat (Bb)
      10: -2,  // Bb major: 2 flats (Bb, Eb)
      3: -3,   // Eb major: 3 flats (Bb, Eb, Ab)
      8: -4,   // Ab major: 4 flats (Bb, Eb, Ab, Db)
      1: -5,   // Db major: 5 flats (Bb, Eb, Ab, Db, Gb)
      6: -6    // Gb major: 6 flats (Bb, Eb, Ab, Db, Gb, Cb)
      // Cb major (7 flats) is added to the keyNameToFifths map
    };
    
    return pitchClassToFifths[pitchClass] || 0; // Default to C major (0 fifths) if not found
  };

  // Helper to convert MIDI note to MusicXML note information
  const getMusicXmlNoteInfo = (midiNote: number, keySignatureFifths: number) => {
    const useFlats = keySignatureFifths < 0; // Negative fifths means flat key signatures
    
    // Note names for sharp keys (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
    const sharpNoteNames = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
    const sharpAlterValues = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
    
    // Note names for flat keys (C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B)
    const flatNoteNames = ['C', 'D', 'D', 'E', 'E', 'F', 'G', 'G', 'A', 'A', 'B', 'B'];
    const flatAlterValues = [0, -1, 0, -1, 0, 0, -1, 0, -1, 0, -1, 0];
    
    const stepIndex = midiNote % 12;
    const xmlOctave = Math.floor(midiNote / 12) - 1;
    
    // Use flat or sharp notation based on key signature
    return {
      step: useFlats ? flatNoteNames[stepIndex] : sharpNoteNames[stepIndex],
      octave: xmlOctave,
      alter: useFlats ? flatAlterValues[stepIndex] : sharpAlterValues[stepIndex]
    };
  };

  // Generate MusicXML for all notes in our range
  const generateMusicXml = useCallback(() => {
    // Sort notes by MIDI number to ensure correct order
    const sortedNotes = [...notes].sort((a, b) => a.note.midiNote - b.note.midiNote);
    
    // Get key signature in fifths - prefer keyName over rootNote for accuracy
    const fifths = keyName ? getKeySignatureByName(keyName) : 
                   rootNote ? getKeySignatureFifths(rootNote) : 0;
    
    // Use the fifths value to determine whether to use flats or sharps for accidentals
    const useFlats = fifths < 0;
    
    let notesXml = '';
    sortedNotes.forEach(noteData => {
      // Pass the key signature fifths to correctly determine sharp vs flat notation
      const noteInfo = getMusicXmlNoteInfo(noteData.note.midiNote, fifths);
      const isSelected = selectedNote && selectedNote.note.midiNote === noteData.note.midiNote;
      const isRoot = rootNote && isRootNote(noteData.note.midiNote, rootNote);
      
      // Determine the color based on selection, root note, or Boomwhacker color
      let noteheadColor = '';
      
      if (isSelected) {
        // Selection takes highest priority
        noteheadColor = '#4caf50';
      } else if (colorByDegree && rootNote) {
        // Apply Boomwhacker colors if enabled
        const pitchClass = noteData.note.midiNote % 12;
        const rootPitchClass = rootNote % 12;
        const relativeDegree = (pitchClass - rootPitchClass + 12) % 12; // Normalize to 0-11
        
        // Use the color map from DEGREE_COLORS
        if (DEGREE_COLORS[relativeDegree]) {
          noteheadColor = DEGREE_COLORS[relativeDegree];
        }
      } else if (isRoot) {
        // Just highlight the root note in red if not using Boomwhacker colors
        noteheadColor = '#e53935';
      }
      
      notesXml += `
      <note id="note-${noteData.note.midiNote}">
        <pitch>
          <step>${noteInfo.step}</step>
          <octave>${noteInfo.octave}</octave>
          ${noteInfo.alter !== 0 ? `<alter>${noteInfo.alter}</alter>` : ''}
        </pitch>
        <duration>4</duration>
        <type>quarter</type>
        ${noteheadColor ? `<stem>up</stem><notehead color="${noteheadColor}"/>` : '<stem>up</stem>'}
        <lyric default-y="-80" justify="center" placement="below">
          <text>${noteData.note.midiNote}</text>
        </lyric>
      </note>`;
    });
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>${fifths}</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>${clef === 'treble' ? 'G' : 'F'}</sign>
          <line>${clef === 'treble' ? '2' : '4'}</line>
        </clef>
      </attributes>
      ${notesXml}
    </measure>
  </part>
</score-partwise>`;
  }, [clef, notes, rootNote, selectedNote, colorByDegree, keyName]);

  // Helper to check if a note is a root note of the scale
  const isRootNote = (midiNote: number, rootMidiNote: number): boolean => {
    // Get the pitch class of the current note and the root note
    const notePitchClass = midiNote % 12;
    const rootPitchClass = rootMidiNote % 12;
    
    // A note is a root note if it's the same pitch class as the root note
    // (i.e., same note in any octave)
    return notePitchClass === rootPitchClass;
  };

  // Use debounced version of onNoteSelect to prevent double triggering
  const debouncedNoteSelect = useCallback(
    debounce((note: NoteData) => {
      onNoteSelect(note);
    }, 50), // 50ms debounce time
    [onNoteSelect]
  );

  // Highlight root notes after OSMD rendering completes
  const highlightRootNotes = useCallback(() => {
    if (!rootNote || !containerRef.current) return;
    
    // Get the SVG element
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    
    console.log("Highlighting root notes based on root MIDI:", rootNote);
    
    // Calculate the pitch class of the root note (0-11)
    const rootPitchClass = rootNote % 12;
    
    // Find all text elements with MIDI numbers
    const textElements = Array.from(svg.querySelectorAll('text'));
    
    for (const textElement of textElements) {
      if (textElement.textContent && !isNaN(parseInt(textElement.textContent))) {
        const midiNumber = parseInt(textElement.textContent);
        const isPitchClassRoot = midiNumber % 12 === rootPitchClass;
        
        if (isPitchClassRoot) {
          console.log(`Found root note: MIDI ${midiNumber}`);
          
          // Find the notehead associated with this MIDI number
          // First, get the position of the text
          const textRect = textElement.getBoundingClientRect();
          const textX = textRect.left + textRect.width / 2;
          const textY = textRect.top;
          
          // Find notes on the staff
          const noteElements = Array.from(svg.querySelectorAll('.vf-notehead'));
          
          // Find the closest notehead to this text
          let closestNote: Element | null = null;
          let minDistance = Infinity;
          
          for (const note of noteElements) {
            const noteRect = note.getBoundingClientRect();
            const noteX = noteRect.left + noteRect.width / 2;
            const noteY = noteRect.top + noteRect.height / 2;
            
            // Calculate distance between text and notehead
            const distance = Math.sqrt(
              Math.pow(textX - noteX, 2) + 
              Math.pow(textY - noteY, 2)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              closestNote = note;
            }
          }
          
          // Color the notehead red if found
          if (closestNote && !closestNote.classList.contains('selected')) {
            try {
              // If it's SVG, we need to use style or attributes
              if (closestNote instanceof SVGElement) {
                closestNote.setAttribute('fill', '#e53935');
                closestNote.setAttribute('data-is-root', 'true');
              } else {
                (closestNote as HTMLElement).style.fill = '#e53935';
                (closestNote as HTMLElement).dataset.isRoot = 'true';
              }
              console.log("Applied root note styling");
            } catch (e) {
              console.error("Error applying root note styling:", e);
            }
          }
        }
      }
    }
  }, [rootNote]);

  // Helper function to highlight selected note
  const highlightNote = (midiNote: number) => {
    if (!containerRef.current) return;
    
    // Reset any previously highlighted notes
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    
    // Remove 'selected' class from all elements
    Array.from(svg.querySelectorAll('.selected')).forEach(el => {
      el.classList.remove('selected');
    });
    
    // Find the text element with the MIDI number
    const selectedText = Array.from(svg.querySelectorAll('text')).find(
      text => text.textContent === midiNote.toString()
    );
    
    // If we found a text element, find the corresponding note
    if (selectedText) {
      const textRect = selectedText.getBoundingClientRect();
      const textX = textRect.left + textRect.width / 2;
      const textY = textRect.top;  // Use the top of the text element
      
      console.log(`Text ${midiNote} position:`, { x: textX, y: textY });
      
      // Find notes on the staff
      const noteElements = Array.from(svg.querySelectorAll('.vf-notehead, .vf-note'));
      console.log(`Found ${noteElements.length} note elements`);
      
      // Different handling based on midi note range and clef
      const isVeryHighNote = midiNote >= 83; // Special handling for very high notes 83-84
      const isHighNote = midiNote > 68 && midiNote < 83; // High but not extreme
      const isInBassClef = clef === 'bass'; // Check if we're in bass clef
      const isBassClefHighRange = isInBassClef && midiNote >= 52; // Special case for trombone
      
      let matchingNote: Element | null = null;
      let bestDistance = Infinity;
      
      // For high notes, focus more on horizontal alignment
      const verticalWeight = isVeryHighNote ? 0.3 : (isHighNote ? 0.6 : 1.0);
      const horizontalWeight = isVeryHighNote ? 1.0 : (isHighNote ? 0.8 : 1.0);
      
      // For bass clef high range, adjust weights
      const adjustedVerticalWeight = isBassClefHighRange ? 0.5 : verticalWeight;
      const adjustedHorizontalWeight = isBassClefHighRange ? 1.0 : horizontalWeight;
      
      for (const note of noteElements) {
        const noteRect = note.getBoundingClientRect();
        const noteX = noteRect.left + noteRect.width / 2;
        const noteY = noteRect.top + noteRect.height / 2;
        
        // Enhanced weighted distance calculation
        // - For high notes, prioritize horizontal alignment
        // - For normal notes, use standard distance
        // - For bass clef high range, also prioritize horizontal alignment
        const horizontalDistance = Math.abs(textX - noteX) * adjustedHorizontalWeight;
        const verticalDistance = Math.abs(textY - noteY) * adjustedVerticalWeight;
        const weightedDistance = Math.sqrt(
          Math.pow(horizontalDistance, 2) + 
          Math.pow(verticalDistance, 2)
        );
        
        // Add extra criteria for very high notes
        let extraCriteria = 0;
        if (isVeryHighNote) {
          // For very high notes, we expect the noteY to be *above* the textY
          // If it's not, add a penalty
          if (noteY > textY) {
            extraCriteria += 30; // Penalty for notes below the text for very high notes
          }
        }
        
        // Add criteria for bass clef high range
        if (isBassClefHighRange) {
          // For bass clef high range, we expect the noteY to be *below* a certain threshold
          // If it's not, add a penalty
          const expectedMaxNoteY = textY - 20; // Expected maximum Y position for high bass clef notes
          if (noteY < expectedMaxNoteY) {
            extraCriteria += 30; // Penalty for notes too high for bass clef high range
          }
        }
        
        const finalDistance = weightedDistance + extraCriteria;
        
        // Debug log for distance calculation
        if (finalDistance < 150) {
          console.log(`Note distance for ${midiNote}: ${finalDistance.toFixed(2)} (h: ${horizontalDistance.toFixed(2)}, v: ${verticalDistance.toFixed(2)}, e: ${extraCriteria})`);
        }
        
        if (finalDistance < bestDistance) {
          bestDistance = finalDistance;
          matchingNote = note;
        }
      }
      
      // Highlight the matching note if found
      if (matchingNote) {
        console.log(`Found matching note for MIDI ${midiNote}, distance: ${bestDistance.toFixed(2)}`);
        try {
          // Use setAttribute instead of classList
          const currentClass = (matchingNote as Element).getAttribute('class') || '';
          (matchingNote as Element).setAttribute('class', currentClass + ' selected');
          
          // Find parent note group by traversing up
          let noteGroup = matchingNote as Element | null;
          
          // Find the vf-note parent by traversing up the DOM tree
          while (noteGroup && 
                !(noteGroup.getAttribute('class') || '').includes('vf-note') && 
                noteGroup !== svg) {
            noteGroup = noteGroup.parentNode as Element;
          }
          
          // Only proceed if we found a valid note group
          if (noteGroup && (noteGroup.getAttribute('class') || '').includes('vf-note')) {
            const currentClass = (noteGroup as Element).getAttribute('class') || '';
            (noteGroup as Element).setAttribute('class', currentClass + ' selected');
            
            // Highlight all components
            const components = (noteGroup as Element).querySelectorAll('.vf-stem, .vf-notehead');
            Array.from(components).forEach((component: Element) => {
              try {
                const currentClass = component.getAttribute('class') || '';
                component.setAttribute('class', currentClass + ' selected');
                
                // If this is a root note that was previously colored red,
                // make sure the selection color takes precedence
                if (component.hasAttribute('data-is-root')) {
                  if (component instanceof SVGElement) {
                    component.setAttribute('fill', '#4caf50'); // Green selection color
                  } else {
                    (component as HTMLElement).style.fill = '#4caf50';
                  }
                }
              } catch (e) {
                console.error('Failed to add selected class to component:', e);
              }
            });
          }
        } catch (e) {
          console.error('Failed to add selected class to note:', e);
        }
      } else {
        console.warn(`No matching note found for MIDI ${midiNote}`);
      }
    }
  };

  // Add the setupClickHandler function before the useEffect
  const setupClickHandler = useCallback(() => {
    if (!containerRef.current) return;
    
    // Remove any existing handler
    if (handleClickRef.current) {
      containerRef.current.removeEventListener('click', handleClickRef.current);
    }
    
    // Create and store the new handler
    const handleClick = (e: MouseEvent) => {
      const target = e.target as SVGElement;
      const noteElement = target.closest('.vf-note');
      
      if (noteElement) {
        // Try to find the note's MIDI number from its ID or data attribute
        const noteId = noteElement.getAttribute('data-midi') || noteElement.id;
        
        if (noteId) {
          // Extract the MIDI number from the ID (format: "note-{midiNumber}")
          const midiMatch = noteId.match(/note-(\d+)/);
          if (midiMatch && midiMatch[1]) {
            const midiNumber = parseInt(midiMatch[1], 10);
            
            // Find the corresponding note data
            const clickedNote = notes.find(n => n.note.midiNote === midiNumber);
            if (clickedNote) {
              debouncedNoteSelect(clickedNote);
            }
          }
        }
      }
    };
    
    // Store the handler for cleanup
    handleClickRef.current = handleClick;
    
    // Add the click handler
    containerRef.current.addEventListener('click', handleClick);
  }, [notes, debouncedNoteSelect]);

  // Setup click handler
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Remove existing click handlers first to prevent duplicates
    if (handleClickRef.current) {
      containerRef.current.removeEventListener('click', handleClickRef.current);
    }
    
    // Create a click handler function
    const handleClick = (e: MouseEvent) => {
      console.log("Click detected in MusicalStaff");
      // Prevent multiple rapid clicks
      const now = Date.now();
      if (now - lastClickTimeRef.current < 200) {
        console.log("Ignoring too rapid click");
        return; // Ignore clicks that are too close together (200ms)
      }
      lastClickTimeRef.current = now;
      
      const target = e.target as HTMLElement;
      
      // Generate a unique identifier for clicked element to detect duplicates
      const elementId = target.tagName + (target.getAttribute('class') || '') + (target.textContent || '');
      if (elementId === lastClickedElementRef.current && now - lastClickTimeRef.current < 500) {
        console.log("Ignoring duplicate click on same element");
        return;
      }
      lastClickedElementRef.current = elementId;
      
      // Log the clicked element for debugging
      console.log("Clicked element:", target.tagName, target);
      
      // Look for a clicked note or text
      let midiNote: number | null = null;
      
      // Check if we clicked directly on text with a MIDI number
      if (target.tagName === 'text' && target.textContent && !isNaN(parseInt(target.textContent))) {
        console.log("Clicked directly on MIDI text:", target.textContent);
        midiNote = parseInt(target.textContent);
      } 
      // Check if we clicked a note element directly
      else if ((target.classList && (
                target.classList.contains('vf-notehead') || 
                target.classList.contains('vf-note') || 
                target.classList.contains('vf-stem'))) ||
                target.tagName === 'path' || 
                target.tagName === 'rect' || 
                target.tagName === 'g') {
        
        console.log("Clicked on a note element");
        // Find the closest MIDI number based on position
        const noteRect = target.getBoundingClientRect();
        const clickX = noteRect.left + noteRect.width / 2;
        const clickY = noteRect.top + noteRect.height / 2;
        
        // Find the closest MIDI text
        if (containerRef.current) {
          const svg = containerRef.current.querySelector('svg');
          if (svg) {
            const textElements = Array.from(svg.querySelectorAll('text'));
            let closestText: Element | null = null;
            let minDistance = Infinity;
            
            for (const text of textElements) {
              if (text.textContent && !isNaN(parseInt(text.textContent))) {
                const textRect = text.getBoundingClientRect();
                const textX = textRect.left + textRect.width / 2;
                const textY = textRect.top + textRect.height / 2;
                
                const distance = Math.sqrt(
                  Math.pow(clickX - textX, 2) + 
                  Math.pow(clickY - textY, 2)
                );
                
                if (distance < minDistance) {
                  minDistance = distance;
                  closestText = text;
                  console.log(`Potential MIDI match: ${text.textContent}, distance: ${distance.toFixed(2)}`);
                }
              }
            }
            
            if (closestText && closestText.textContent) {
              midiNote = parseInt(closestText.textContent);
              console.log(`Found closest MIDI: ${midiNote}`);
            }
          }
        }
      }
      
      // If we couldn't determine a MIDI note yet, try position-based search
      if (!midiNote && containerRef.current) {
        console.log("Trying position-based search");
        const svg = containerRef.current.querySelector('svg');
        if (svg) {
          // Get the target's position
          const rect = target.getBoundingClientRect();
          const targetX = rect.left + rect.width / 2;
          const targetY = rect.top + rect.height / 2;
          
          console.log("Target position:", { x: targetX, y: targetY });
          
          // Find the closest text element containing a MIDI number
          const textElements = Array.from(svg.querySelectorAll('text'));
          let closestText: Element | null = null;
          let closestDistance = Infinity;
          
          for (const text of textElements) {
            const content = text.textContent;
            if (content && !isNaN(parseInt(content))) {
              const textRect = text.getBoundingClientRect();
              const textX = textRect.left + textRect.width / 2;
              const textY = textRect.top + textRect.height / 2;
              
              // For notes above MIDI 68 or bass clef high notes, increase the vertical search range
              const midiValue = parseInt(content);
              const isSpecialCase = midiValue > 68 || (clef === 'bass' && midiValue >= 52);
              const verticalSearchRange = isSpecialCase ? 200 : 100;
              
              // Calculate distance (prioritize vertical alignment more)
              const horizontalDistance = Math.abs(targetX - textX);
              const verticalDistance = Math.abs(targetY - textY);
              
              // Accept clicks that are within reasonable distance
              // Higher notes need more vertical range
              if (horizontalDistance < 50 && verticalDistance < verticalSearchRange) {
                const distance = horizontalDistance * 2 + verticalDistance;
                
                if (distance < closestDistance) {
                  closestDistance = distance;
                  closestText = text;
                  console.log(`Potential match: MIDI ${content}, distance: ${distance.toFixed(2)}`);
                }
              }
            }
          }
          
          if (closestText && closestText.textContent) {
            console.log("Found closest text:", closestText.textContent, "distance:", closestDistance.toFixed(2));
            midiNote = parseInt(closestText.textContent);
          }
        }
      }
      
      // If we found a MIDI note, select it
      if (midiNote !== null) {
        console.log("Selected MIDI note:", midiNote);
        const note = notes.find(n => n.note.midiNote === midiNote);
        if (note) {
          console.log("Found matching note object:", note);
          // Use the debounced version to prevent double triggering
          highlightNote(midiNote);
          // Call the callback with a slight delay to ensure the UI updates first
          setTimeout(() => onNoteSelect(note), 10);
        } else {
          console.log("No matching note found for MIDI:", midiNote);
        }
      }
    };
    
    // Store the handler for cleanup
    handleClickRef.current = handleClick;
    
    // Add the click handler
    containerRef.current.addEventListener('click', handleClick);
    
    // Clean up event listener on unmount
    return () => {
      if (containerRef.current && handleClickRef.current) {
        containerRef.current.removeEventListener('click', handleClickRef.current);
      }
    };
  }, [clef, notes, onNoteSelect, highlightNote]);

  // Initial OSMD rendering
  useEffect(() => {
    const renderScore = async () => {
      if (!containerRef.current) return;
      
      try {
        // Clear previous instance if it exists
        if (osmdRef.current) {
          containerRef.current.innerHTML = '';
        }
        
        // Create new OSMD instance
        osmdRef.current = new OpenSheetMusicDisplay(containerRef.current);
        
        // Configure OSMD options
        osmdRef.current.setOptions({
          backend: "svg",
          drawTitle: false,
          drawSubtitle: false,
          drawPartNames: false,
          drawMeasureNumbers: false,
          drawTimeSignatures: false,
          autoResize: true,
          followCursor: false
        });
        
        const musicXml = generateMusicXml();
        await osmdRef.current.load(musicXml);
        await osmdRef.current.render();
        
        // Mark as rendered so we know we're ready for click handlers
        setHasRendered(true);
        
        // Add note selection click handler
        setupClickHandler();
        
        console.log("OSMD staff rendered");
        
      } catch (error) {
        console.error('Error rendering MusicalStaff:', error);
      }
    };
    
    renderScore();
    
    // Cleanup on unmount
    return () => {
      if (containerRef.current && handleClickRef.current) {
        containerRef.current.removeEventListener('click', handleClickRef.current);
      }
    };
  }, [notes, selectedNote, rootNote, colorByDegree, clef, keyName, generateMusicXml]);
  
  return (
    <div 
      className="musical-staff"
      ref={containerRef} 
      style={{ 
        width: '100%',
        minHeight: '150px', 
        position: 'relative',
      }}
    ></div>
  );
};

export default MusicalStaff; 