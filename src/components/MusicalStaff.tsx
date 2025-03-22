import React, { useEffect, useRef, useCallback, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import { NoteData, Clef } from '../types';

// Debounce utility to prevent rapid multiple clicks
const debounce = (func: Function, delay: number) => {
  let timerId: number | null = null;
  return (...args: any[]) => {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = window.setTimeout(() => {
      func(...args);
      timerId = null;
    }, delay);
  };
};

interface MusicalStaffProps {
  clef: Clef;
  notes: NoteData[];
  onNoteSelect: (note: NoteData) => void;
  selectedNote: NoteData | null;
}

const MusicalStaff: React.FC<MusicalStaffProps> = ({ clef, notes, onNoteSelect, selectedNote }) => {
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastClickedElementRef = useRef<string | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const handleClickRef = React.useRef<((e: MouseEvent) => void) | null>(null) as React.MutableRefObject<((e: MouseEvent) => void) | null>;
  
  // Generate MusicXML for all notes in our range
  const generateMusicXml = () => {
    // Sort notes by MIDI number to ensure correct order
    const sortedNotes = [...notes].sort((a, b) => a.note.midiNote - b.note.midiNote);
    
    let notesXml = '';
    sortedNotes.forEach(noteData => {
      const noteInfo = getMusicXmlNoteInfo(noteData.note.midiNote);
      const isSelected = selectedNote && selectedNote.note.midiNote === noteData.note.midiNote;
      
      notesXml += `
      <note id="note-${noteData.note.midiNote}">
        <pitch>
          <step>${noteInfo.step}</step>
          <octave>${noteInfo.octave}</octave>
          ${noteInfo.alter ? `<alter>${noteInfo.alter}</alter>` : ''}
        </pitch>
        <duration>4</duration>
        <type>quarter</type>
        ${isSelected ? '<stem>up</stem><notehead color="#4caf50"/>' : '<stem>up</stem>'}
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
          <fifths>0</fifths>
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
  };

  // Helper to convert MIDI note to MusicXML note information
  const getMusicXmlNoteInfo = (midiNote: number) => {
    const noteNames = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
    const alterValues = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
    const stepIndex = midiNote % 12;
    const xmlOctave = Math.floor(midiNote / 12) - 1;
    
    return {
      step: noteNames[stepIndex],
      octave: xmlOctave,
      alter: alterValues[stepIndex]
    };
  };

  // Use debounced version of onNoteSelect to prevent double triggering
  const debouncedNoteSelect = useCallback(
    debounce((note: NoteData) => {
      onNoteSelect(note);
    }, 50), // 50ms debounce time
    [onNoteSelect]
  );

  // Highlight the selected note visually
  const highlightNote = (midiNote: number) => {
    if (!containerRef.current) return;
    
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    
    console.log(`Highlighting note: MIDI ${midiNote}`);
    
    try {
      // Clear previous selections
      svg.querySelectorAll('.selected').forEach(el => {
        try {
          // Use setAttribute which works for both HTML and SVG elements
          el.setAttribute('class', el.getAttribute('class')?.replace('selected', '') || '');
        } catch (e) {
          console.error('Failed to remove selected class:', e);
        }
      });
      
      // Find all text elements with this MIDI note
      const textElements = Array.from(svg.querySelectorAll('text'));
      let selectedText: Element | null = null;
      
      for (const text of textElements) {
        if (text.textContent === midiNote.toString()) {
          selectedText = text;
          try {
            // Use setAttribute instead of classList
            const currentClass = text.getAttribute('class') || '';
            text.setAttribute('class', currentClass + ' selected');
            console.log(`MIDI text ${midiNote} highlighted`);
          } catch (e) {
            console.error('Failed to add selected class to text:', e);
          }
          break;
        }
      }
      
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
        
        noteElements.forEach(note => {
          const noteRect = note.getBoundingClientRect();
          const noteX = noteRect.left + noteRect.width / 2;
          const noteY = noteRect.top + noteRect.height / 2;
          
          const horizontalDistance = Math.abs(noteX - textX);
          const verticalDistance = textY - noteY; // Note should be above text (positive value)
          
          // Log the current note element being checked
          console.log(`Checking note element:`, { 
            noteX, 
            noteY, 
            horizontalDist: horizontalDistance,
            verticalDist: verticalDistance,
            element: note.tagName,
            classList: note.getAttribute('class')
          });
          
          // Different matching logic based on note type
          if (isVeryHighNote) {
            // For extremely high notes (83-84), relax horizontal constraint further
            // and search in a wider vertical range
            if (horizontalDistance < 50 && verticalDistance > 0 && verticalDistance < 200) {
              const distance = horizontalDistance + Math.abs(verticalDistance) * 0.3;
              console.log(`Very high note (${midiNote}) potential match: distance=${distance.toFixed(2)}`);
              
              if (distance < bestDistance) {
                bestDistance = distance;
                matchingNote = note;
              }
            }
          } else if (isBassClefHighRange) {
            // Special case for trombone bass clef high range (52+)
            // These may have different positioning compared to treble clef
            if (horizontalDistance < 40) {
              // In bass clef, the relationship between text and note might be different
              // We care more about horizontal alignment
              const distance = horizontalDistance * 3 + Math.abs(verticalDistance) * 0.5;
              console.log(`Bass clef high range (${midiNote}) potential match: distance=${distance.toFixed(2)}`);
              
              if (distance < bestDistance && distance < 200) {
                bestDistance = distance;
                matchingNote = note;
              }
            }
          } else if (isHighNote) {
            // For high notes, look for notes that are horizontally aligned and above the text
            if (horizontalDistance < 30 && verticalDistance > 0) {
              const distance = horizontalDistance * 2 + Math.abs(verticalDistance) * 0.5;
              console.log(`High note (${midiNote}) potential match: distance=${distance.toFixed(2)}`);
              
              if (distance < bestDistance) {
                bestDistance = distance;
                matchingNote = note;
              }
            }
          } else {
            // For regular notes, use more standard distance calculation
            const distance = horizontalDistance * 2 + Math.abs(verticalDistance);
            if (distance < bestDistance && distance < 80) {
              bestDistance = distance;
              matchingNote = note;
            }
          }
        });
        
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
    } catch (e) {
      console.error('Error in highlightNote:', e);
    }
  };

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

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous content
    containerRef.current.innerHTML = '';
    
    // Create container for OSMD
    const osmdContainer = document.createElement('div');
    osmdContainer.id = 'osmd-container';
    containerRef.current.appendChild(osmdContainer);
    
    // Initialize OSMD
    osmdRef.current = new OpenSheetMusicDisplay(osmdContainer, {
      autoResize: false, // Disable auto resize to maintain fixed note size
      drawingParameters: 'compact',
      drawPartNames: false,
      drawTitle: false,
      drawSubtitle: false,
      drawComposer: false,
      drawLyricist: false,
      drawMeasureNumbers: false,
      renderSingleHorizontalStaffline: true,
      drawCredits: false,
      followCursor: false
    });
    
    // Apply scale transformation after rendering
    osmdRef.current.zoom = 1.0; // This is the correct way to set scale in OSMD

    // Style the container for horizontal scrolling
    osmdContainer.style.overflowX = 'auto';
    osmdContainer.style.overflowY = 'hidden';
    osmdContainer.style.width = '100%';
    osmdContainer.style.maxWidth = '100%';
    osmdContainer.style.whiteSpace = 'nowrap';

    // Set a minimum width based on the number of notes to ensure proper spacing
    const minWidth = Math.max(notes.length * 40, 800); // 40px per note, minimum 800px
    osmdContainer.style.minWidth = `${minWidth}px`;
    
    // Load and render music
    const xml = generateMusicXml();
    osmdRef.current.load(xml)
      .then(() => {
        osmdRef.current?.render();
        
        // Apply fixed zoom level after rendering to ensure consistent note size
        if (osmdRef.current) {
          osmdRef.current.zoom = 1.0;
          
          // If in advanced mode (more notes), ensure we have proper width
          if (notes.length > 30) {
            const staffWidth = Math.max(notes.length * 35, 1000);
            const svgElement = osmdContainer.querySelector('svg');
            if (svgElement) {
              svgElement.style.width = `${staffWidth}px`;
              svgElement.setAttribute('width', `${staffWidth}`);
            }
          }
        }
        
        // Wait for rendering to complete
        setTimeout(() => {
          // Highlight the selected note if any
          if (selectedNote) {
            highlightNote(selectedNote.note.midiNote);
          }
          
          // Add helper text
          const helper = document.createElement('div');
          helper.className = 'note-click-helper';
          helper.textContent = 'Click on any note or the number below it to select';
          containerRef.current?.appendChild(helper);
        }, 100);
      })
      .catch(err => console.error('Error rendering music:', err));
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clef, notes, onNoteSelect, selectedNote]);
  
  return (
    <div className="staff-container">
      <div className="staff-content" ref={containerRef}></div>
    </div>
  );
};

export default MusicalStaff; 