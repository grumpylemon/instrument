import { InstrumentPitch } from '../types';
import * as Tone from 'tone';

// Global audio context
let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
let activeNotes: { oscillator: OscillatorNode, gainNode: GainNode, nodes: AudioNode[] }[] = [];

// Flag to track if audio is initialized
let isAudioInitialized = false;

// Soundfont support
let soundfontSynth: any = null;
let soundfontLoaded = false;

// Create audio context
let activeOscillators: Map<number, OscillatorNode[]> = new Map();

// Track active oscillators to stop them properly
let activeOscillatorsList: {oscillator: OscillatorNode, gain: GainNode}[] = [];

// Export the audio context for direct access if needed
export const getAudioContext = (): AudioContext | null => audioContext;

// Initialize context lazily and return a reference to it
const createAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    console.log('Creating new AudioContext');
    // Using try-catch for better error handling
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create main gain node immediately when creating context
      if (audioContext && !gainNode) {
        gainNode = audioContext.createGain();
        gainNode.gain.value = 0.7; // Default volume
        gainNode.connect(audioContext.destination);
      }
    } catch (e) {
      console.error('Failed to create AudioContext:', e);
    }
  }
  return audioContext as AudioContext;
};

// For pitch calculations
const midiToFrequency = (midiNote: number): number => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

/**
 * Initialize the audio context
 */
export const initializeAudio = (): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      if (!audioContext) {
        // Use the AudioContext from Tone.js
        // @ts-ignore
        audioContext = Tone.context.rawContext || Tone.context; 
        console.log("Audio context created:", audioContext);
        
        if (!gainNode) {
          // Create a master gain node
          gainNode = audioContext.createGain();
          gainNode.gain.setValueAtTime(1, audioContext.currentTime);
          gainNode.connect(audioContext.destination);
          console.log("Master gain node created");
        }
        
        // Initialize Soundfont
        initializeSoundfont().then(success => {
          isAudioInitialized = true;
          console.log("Audio initialization completed, soundfont loaded:", success);
          resolve(true);
        }).catch(error => {
          console.error("Soundfont initialization failed, using fallback sounds:", error);
          isAudioInitialized = true;
          resolve(true);
        });
      } else {
        console.log("Audio was already initialized");
        isAudioInitialized = true;
        resolve(true);
      }
    } catch (error) {
      console.error("Error initializing audio:", error);
      resolve(false);
    }
  });
};

/**
 * Initialize the Soundfont synthesizer
 */
const initializeSoundfont = async (): Promise<boolean> => {
  try {
    if (soundfontLoaded) {
      return true;
    }
    
    // Check if the Web Audio API supports AudioWorklet
    const hasAudioWorklet = 'audioWorklet' in AudioContext.prototype;
    
    if (hasAudioWorklet) {
      // Modern browsers with AudioWorklet support
      console.log("Using Tone.js Sampler for soundfont playback");
      
      // Create Tone.js based synthesizer using samples
      if (!soundfontSynth) {
        // We'll set up basic instruments first and then load the soundfont if available
        soundfontSynth = new Tone.Sampler({
          urls: {
            "C4": "piano-c4.mp3",
          },
          baseUrl: "/soundfonts/",
          onload: () => {
            console.log("Basic sampler loaded");
          }
        }).toDestination();
        
        // Try to load the FluidR3_GM.sf2 soundfont
        // This requires a Soundfont player library or conversion to individual samples
        // We'll check if the soundfont file exists
        fetch('/soundfonts/FluidR3_GM.sf2')
          .then(response => {
            if (response.ok) {
              console.log("FluidR3_GM.sf2 soundfont is available");
              soundfontLoaded = true;
            } else {
              console.log("FluidR3_GM.sf2 soundfont not found, using basic sounds");
            }
          })
          .catch(error => {
            console.error("Error checking soundfont:", error);
          });
      }
      
      return true;
    } else {
      // Fallback for browsers without AudioWorklet support
      console.log("AudioWorklet not supported, using basic oscillators");
      return false;
    }
  } catch (error) {
    console.error("Error initializing soundfont:", error);
    return false;
  }
};

/**
 * Unlock the audio context on mobile devices
 */
export const unlockAudioContext = async (): Promise<boolean> => {
  try {
    if (audioContext && audioContext.state !== 'running') {
      console.log("Attempting to resume audio context. Current state:", audioContext.state);
      await Tone.start();
      console.log("Tone.start() called, new audio context state:", audioContext.state);
      return true;
    }
    return true;
  } catch (error) {
    console.error("Error unlocking audio context:", error);
    return false;
  }
};

/**
 * Play a note with the given MIDI number
 */
export const playNote = (
  instrument: string,
  midiNumber: number,
  pitch: string = 'C',
  duration: number = 1,
  volume: number = 0.7,
  soundType: string = 'default'
): void => {
  if (!audioContext) {
    console.warn("Audio not initialized. Cannot play note.");
    return;
  }

  // Stop any currently playing notes
  stopActiveNotes();

  console.log(`Playing ${instrument} note: MIDI=${midiNumber}, Pitch=${pitch}, Duration=${duration}, Volume=${volume}, Sound=${soundType}`);

  try {
    // Get the frequency for the MIDI note
    const frequency = getNoteFrequency(midiNumber);
    
    // Try to use the soundfont if loaded
    if (soundfontLoaded && soundfontSynth) {
      try {
        // Convert MIDI number to note name for Tone.js
        const noteName = midiToNoteName(midiNumber);
        
        // Set volume
        soundfontSynth.volume.value = Tone.gainToDb(volume);
        
        // Get appropriate instrument based on selection
        let soundfontInstrument = 'acoustic_grand_piano';
        if (instrument === 'trumpet') {
          soundfontInstrument = 'trumpet';
        } else if (instrument === 'trombone') {
          soundfontInstrument = 'trombone';
        } else if (instrument === 'recorder') {
          soundfontInstrument = 'recorder';
        } else if (instrument === 'ocarina') {
          soundfontInstrument = 'ocarina'; // May not exist in GM soundfont
        }
        
        // Play the note using the soundfont
        soundfontSynth.triggerAttackRelease(noteName, duration);
        console.log(`Played note ${noteName} using soundfont ${soundfontInstrument}`);
        return;
      } catch (error) {
        console.error("Error playing with soundfont, falling back to oscillator:", error);
      }
    }
    
    // Fallback to oscillator-based synthesis
    playNoteWithOscillator(instrument, frequency, duration, volume, soundType);
    
  } catch (error) {
    console.error("Error playing note:", error);
  }
};

/**
 * Convert MIDI number to note name (e.g., 60 -> "C4")
 */
const midiToNoteName = (midi: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
};

/**
 * Play a note using basic oscillator synthesis
 */
const playNoteWithOscillator = (
  instrument: string,
  frequency: number,
  duration: number = 1,
  volume: number = 0.7,
  soundType: string = 'default'
): void => {
  if (!audioContext || !gainNode) {
    console.warn("Audio not initialized. Cannot play note with oscillator.");
    return;
  }
  
  try {
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    
    // Create a gain node for this note
    const noteGain = audioContext.createGain();
    noteGain.gain.setValueAtTime(0, audioContext.currentTime);
    
    // Configure sound type and get resulting nodes
    const [lastNode, ...additionalNodes] = configureSoundType(
      audioContext,
      oscillator,
      instrument as 'trumpet' | 'trombone',
      soundType
    );
    
    // Connect the last node in the chain to the note gain node
    lastNode.connect(noteGain);
    
    // Connect the note gain to the master gain
    noteGain.connect(gainNode);
    
    // Start the oscillator
    oscillator.start(audioContext.currentTime);
    
    // Attack phase
    noteGain.gain.setValueAtTime(0, audioContext.currentTime);
    noteGain.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.02);
    
    // Sustain phase
    noteGain.gain.setValueAtTime(volume, audioContext.currentTime + duration - 0.05);
    
    // Release phase
    noteGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);
    
    // Schedule oscillator stop
    oscillator.stop(audioContext.currentTime + duration + 0.1);
    
    // Store active notes for later cleanup
    activeNotes.push({ oscillator, gainNode: noteGain, nodes: additionalNodes });
    
    // Clean up when the note finishes
    setTimeout(() => {
      stopActiveNotes();
    }, (duration + 0.2) * 1000);
    
  } catch (error) {
    console.error("Error playing note with oscillator:", error);
  }
};

/**
 * Calculate frequency for a MIDI note number
 */
export const getNoteFrequency = (midiNumber: number): number => {
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
};

/**
 * Configure instrument timbre based on sound type
 */
const configureSoundType = (
  context: AudioContext,
  oscillator: OscillatorNode,
  instrument: 'trumpet' | 'trombone',
  soundType: string = 'default'
): [AudioNode, ...AudioNode[]] => {
  let lastNode: AudioNode = oscillator;
  const audioNodes: AudioNode[] = [];
  
  // Create filters and wave shapers based on sound type
  switch (soundType) {
    case 'piano': {
      // Piano-like sound
      oscillator.type = 'triangle';
      
      // Create a second oscillator for harmonics
      const harmonicOsc = context.createOscillator();
      harmonicOsc.type = 'triangle';
      harmonicOsc.frequency.value = oscillator.frequency.value * 2.001; // Second harmonic with slight detune
      harmonicOsc.start(context.currentTime);
      harmonicOsc.stop(context.currentTime + 2);
      
      // Create a third oscillator for more color
      const colorOsc = context.createOscillator();
      colorOsc.type = 'sine';
      colorOsc.frequency.value = oscillator.frequency.value * 4.002; // Fourth harmonic with slight detune
      colorOsc.start(context.currentTime);
      colorOsc.stop(context.currentTime + 1.5);
      
      // Create gain nodes for mixing
      const mainGain = context.createGain();
      mainGain.gain.value = 0.5;
      
      const harmonicGain = context.createGain();
      harmonicGain.gain.value = 0.15;
      
      const colorGain = context.createGain();
      colorGain.gain.value = 0.05;
      
      // Attack and decay envelope for piano-like sound
      mainGain.gain.setValueAtTime(0, context.currentTime);
      mainGain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.01);
      mainGain.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 0.2);
      mainGain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1.5);
      
      // Connect oscillators to their gain nodes
      oscillator.connect(mainGain);
      harmonicOsc.connect(harmonicGain);
      colorOsc.connect(colorGain);
      
      // Create a compressor to shape the sound
      const compressor = context.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      // Mix all oscillators into the compressor
      mainGain.connect(compressor);
      harmonicGain.connect(compressor);
      colorGain.connect(compressor);
      
      // Add piano-like dynamic filtering
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3000;
      filter.Q.value = 0.7;
      
      // Quick attack and longer decay for filter
      filter.frequency.setValueAtTime(5000, context.currentTime);
      filter.frequency.exponentialRampToValueAtTime(2000, context.currentTime + 1);
      
      // Connect the chain
      compressor.connect(filter);
      lastNode = filter;
      
      // Add all created nodes to the nodes array for cleanup
      audioNodes.push(mainGain, harmonicGain, colorGain, compressor, filter, harmonicOsc, colorOsc);
      break;
    }
    
    case 'synth': {
      // Synthesizer-like sound with multiple oscillators
      oscillator.type = 'sawtooth';
      
      // Create a second oscillator for layering
      const subOsc = context.createOscillator();
      subOsc.type = 'square';
      subOsc.frequency.value = oscillator.frequency.value * 0.5; // One octave below
      subOsc.start(context.currentTime);
      subOsc.stop(context.currentTime + 2);
      
      // Mix the oscillators
      const mainGain = context.createGain();
      mainGain.gain.value = 0.5;
      
      const subGain = context.createGain();
      subGain.gain.value = 0.3;
      
      oscillator.connect(mainGain);
      subOsc.connect(subGain);
      
      // Add a bandpass filter for synth character
      const filter = context.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = oscillator.frequency.value * 2;
      filter.Q.value = 2;
      
      // Create filter envelope
      filter.frequency.setValueAtTime(oscillator.frequency.value * 4, context.currentTime);
      filter.frequency.exponentialRampToValueAtTime(oscillator.frequency.value * 1.5, context.currentTime + 0.5);
      filter.frequency.exponentialRampToValueAtTime(oscillator.frequency.value * 2, context.currentTime + 1);
      
      // Create a second filter for overall tone
      const lowpass = context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 4000;
      
      // Mix and connect the filters
      mainGain.connect(filter);
      subGain.connect(filter);
      filter.connect(lowpass);
      
      // Add some subtle distortion for synth character
      const waveshaper = context.createWaveShaper();
      const distortionAmount = 3;
      const curve = new Float32Array(context.sampleRate);
      for (let i = 0; i < context.sampleRate; i++) {
        const x = (i * 2) / context.sampleRate - 1;
        curve[i] = (Math.PI + distortionAmount) * x / (Math.PI + distortionAmount * Math.abs(x));
      }
      waveshaper.curve = curve;
      waveshaper.oversample = '4x';
      
      lowpass.connect(waveshaper);
      lastNode = waveshaper;
      
      // Store all nodes for cleanup
      audioNodes.push(mainGain, subGain, filter, lowpass, waveshaper, subOsc);
      break;
    }

    case 'bright': {
      // Bright sound with more harmonics
      oscillator.type = 'sawtooth';
      
      // Add a high shelf filter to boost high frequencies
      const highShelf = context.createBiquadFilter();
      highShelf.type = 'highshelf';
      highShelf.frequency.value = 2000;
      highShelf.gain.value = 15;
      
      // Add some distortion for brightness
      const distortion = context.createWaveShaper();
      const distortionAmount = 5;
      const curve = new Float32Array(context.sampleRate);
      for (let i = 0; i < context.sampleRate; i++) {
        const x = (i * 2) / context.sampleRate - 1;
        curve[i] = Math.tanh(distortionAmount * x) / distortionAmount;
      }
      distortion.curve = curve;
      distortion.oversample = '4x';
      
      // Connect the chain
      lastNode.connect(highShelf);
      lastNode = highShelf;
      audioNodes.push(highShelf);
      
      lastNode.connect(distortion);
      lastNode = distortion;
      audioNodes.push(distortion);
      break;
    }
    
    case 'mellow': {
      // Mellow sound with fewer harmonics
      oscillator.type = 'sine';
      
      // Add a second oscillator for a slight natural chorus effect
      const secondOsc = context.createOscillator();
      secondOsc.type = 'sine';
      secondOsc.frequency.value = oscillator.frequency.value * 1.002; // Very slight detune
      secondOsc.start(context.currentTime);
      secondOsc.stop(context.currentTime + 2); // Default 2 second duration
      
      // Mix the oscillators
      const mixer = context.createGain();
      mixer.gain.value = 0.5;
      secondOsc.connect(mixer);
      lastNode.connect(mixer);
      lastNode = mixer;
      audioNodes.push(mixer, secondOsc);
      
      // Lowpass filter for mellow tone
      const lowpass = context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 1200;
      lowpass.Q.value = 0.5;
      
      lastNode.connect(lowpass);
      lastNode = lowpass;
      audioNodes.push(lowpass);
      break;
    }
    
    case 'brilliant': {
      // Brilliant sound with rich harmonics
      oscillator.type = 'square';
      
      // Add a formant filter for brass-like brilliance
      const formant1 = context.createBiquadFilter();
      formant1.type = 'peaking';
      formant1.frequency.value = 800;
      formant1.Q.value = 5;
      formant1.gain.value = 10;
      
      const formant2 = context.createBiquadFilter();
      formant2.type = 'peaking';
      formant2.frequency.value = 1400;
      formant2.Q.value = 8;
      formant2.gain.value = 15;
      
      lastNode.connect(formant1);
      formant1.connect(formant2);
      lastNode = formant2;
      audioNodes.push(formant1, formant2);
      break;
    }
    
    case 'warm': {
      // Warm sound with moderate harmonics
      oscillator.type = 'triangle';
      
      // Add a subtle harmonic enhancer
      const enhancer = context.createBiquadFilter();
      enhancer.type = 'peaking';
      enhancer.frequency.value = 600;
      enhancer.Q.value = 0.7;
      enhancer.gain.value = 6;
      
      // Add a very slight reverb simulation
      const convolver = context.createConvolver();
      const reverbLength = 0.5;
      const rate = context.sampleRate;
      const reverbBuffer = context.createBuffer(2, rate * reverbLength, rate);
      
      for (let channel = 0; channel < 2; channel++) {
        const data = reverbBuffer.getChannelData(channel);
        for (let i = 0; i < data.length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (rate * reverbLength / 2));
        }
      }
      
      convolver.buffer = reverbBuffer;
      
      lastNode.connect(enhancer);
      enhancer.connect(convolver);
      lastNode = convolver;
      audioNodes.push(enhancer, convolver);
      break;
    }
    
    default: {
      // Default instrument sound
      if (instrument === 'trumpet') {
        oscillator.type = 'sawtooth';
        
        // Simple filter for default trumpet sound
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        
        lastNode.connect(filter);
        lastNode = filter;
        audioNodes.push(filter);
      } else { // Trombone
        oscillator.type = 'sine';
        
        // Simple filter for default trombone sound
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1500;
        
        lastNode.connect(filter);
        lastNode = filter;
        audioNodes.push(filter);
      }
    }
  }
  
  return [lastNode, ...audioNodes];
};

/**
 * Stop all currently active notes
 */
export const stopActiveNotes = (): void => {
  // Stop oscillator-based notes
  activeNotes.forEach(({ oscillator, gainNode, nodes }) => {
    try {
      // Immediate release if still playing
      if (audioContext && gainNode.gain.value > 0) {
        gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.02);
      }
      
      // Schedule oscillator to stop
      setTimeout(() => {
        try {
          oscillator.stop();
          oscillator.disconnect();
          gainNode.disconnect();
          
          // Disconnect all additional nodes
          nodes.forEach(node => {
            try {
              node.disconnect();
            } catch (error) {
              // Ignore errors when disconnecting nodes
            }
          });
        } catch (error) {
          // Ignore errors when stopping already stopped oscillators
        }
      }, 30);
    } catch (error) {
      console.error("Error stopping note:", error);
    }
  });
  
  // Clear the active notes array
  activeNotes = [];
  
  // If using soundfont, also stop those notes
  if (soundfontSynth) {
    try {
      soundfontSynth.releaseAll();
    } catch (error) {
      console.error("Error stopping soundfont notes:", error);
    }
  }
};

/**
 * Stop all currently playing sounds
 */
export const stopAllSounds = (): void => {
  stopActiveNotes();
  
  if (audioContext) {
    // We suspend instead of close to keep the context usable
    audioContext.suspend().then(() => {
      console.log('Audio context suspended');
    });
  }
};

// Function to ensure audio is resumed on user interaction
export const resumeAudioContext = async (): Promise<void> => {
  if (!audioContext) {
    return initializeAudio();
  }
  
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume();
      console.log('Audio context resumed on user interaction');
    } catch (error) {
      console.error('Failed to resume audio context:', error);
    }
  }
};

// Add this function to handle audio context unlocking
export const unlockAudioContext = async (): Promise<boolean> => {
  try {
    // Create a silent audio buffer
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume the audio context if it's suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    // Create a short, silent sound
    const buffer = audioContext.createBuffer(1, 1, 22050);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    
    console.log('Audio context unlocked successfully');
    return true;
  } catch (error) {
    console.error('Failed to unlock audio context:', error);
    return false;
  }
} 