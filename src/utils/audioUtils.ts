import { InstrumentPitch } from '../types';

// Create audio context
let audioContext: AudioContext | null = null;
let gainNode: GainNode | null = null;
const activeOscillators: Map<number, OscillatorNode[]> = new Map();

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
 * Initialize the audio system
 */
export const initializeAudio = async (): Promise<void> => {
  try {
    // Create context if not exists
    if (!audioContext) {
      audioContext = createAudioContext();
    }
    
    // Try to resume if suspended
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume();
        console.log('Audio context resumed');
      } catch (e) {
        console.error('Failed to resume audio context:', e);
      }
    }
    
    // Create gain node if not exists
    if (!gainNode) {
      gainNode = audioContext.createGain();
      gainNode.gain.value = 0.7;
      gainNode.connect(audioContext.destination);
    }
    
    // Play a silent sound to "wake up" audio on iOS
    const silentOsc = audioContext.createOscillator();
    silentOsc.frequency.value = 440;
    const silentGain = audioContext.createGain();
    silentGain.gain.value = 0.00001; // Nearly silent
    silentOsc.connect(silentGain);
    silentGain.connect(audioContext.destination);
    silentOsc.start();
    silentOsc.stop(audioContext.currentTime + 0.1);
    
    console.log('Audio initialized successfully: state =', audioContext.state);
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to initialize audio:', error);
    return Promise.reject(error);
  }
};

/**
 * Stop any currently playing notes
 */
export const stopActiveNotes = (): void => {
  console.log(`Stopping ${activeOscillatorsList.length} active oscillators`);
  
  if (audioContext && activeOscillatorsList.length > 0) {
    // Fade out all active oscillators
    activeOscillatorsList.forEach(({oscillator, gain}) => {
      try {
        // Quick fade out to avoid clicks
        const now = audioContext!.currentTime;
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.05);
        
        // Schedule oscillator to stop after fade out
        setTimeout(() => {
          try {
            oscillator.stop();
            oscillator.disconnect();
            gain.disconnect();
          } catch (e) {
            // Ignore errors from already stopped oscillators
          }
        }, 60);
      } catch (e) {
        console.warn('Error stopping oscillator:', e);
      }
    });
    
    // Clear the array
    activeOscillatorsList = [];
  }
};

/**
 * Configure instrument timbre based on sound type
 */
const configureSoundType = (
  context: AudioContext,
  oscillator: OscillatorNode,
  instrument: 'trumpet' | 'trombone',
  soundType: string = 'default'
): AudioNode[] => {
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
 * Play a note with the specified MIDI note number
 */
export const playNote = (
  instrument: string,
  midiNote: number,
  pitch: string,
  duration: number = 1,
  volume: number = 0.7,
  soundType: string = 'default'
): void => {
  console.log(`Attempting to play: MIDI=${midiNote}, volume=${volume}`);
  
  // Create context if not already created
  if (!audioContext) {
    try {
      audioContext = createAudioContext();
    } catch (e) {
      console.error('Failed to create audio context:', e);
      return;
    }
  }
  
  // Force resume audioContext if it's suspended
  if (audioContext.state === 'suspended') {
    audioContext.resume().then(() => {
      console.log('AudioContext resumed in playNote');
      // Try again after resuming
      setTimeout(() => {
        playNote(instrument, midiNote, pitch, duration, volume, soundType);
      }, 100);
    }).catch(err => {
      console.error('Failed to resume audio context:', err);
    });
    return;
  }
  
  try {
    // Stop any previously playing notes
    stopActiveNotes();
    
    // Calculate the frequency from MIDI note number
    const frequency = midiToFrequency(midiNote);
    console.log(`Playing frequency: ${frequency.toFixed(2)} Hz`);
    
    // Create oscillator
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'triangle'; // Default waveform
    oscillator.frequency.value = frequency;
    
    // Create gain node for this note
    const noteGain = audioContext.createGain();
    noteGain.gain.value = 0; // Start at zero to avoid clicks
    
    // Ensure main gain node exists and is properly connected
    if (!gainNode) {
      gainNode = audioContext.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(audioContext.destination);
    }
    
    // Connect the oscillator to the gain nodes
    oscillator.connect(noteGain);
    noteGain.connect(audioContext.destination); // Connect directly to destination for reliability
    
    // Apply envelope
    const now = audioContext.currentTime;
    
    // Attack - fade in over 10ms
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(volume, now + 0.01);
    
    // Decay and sustain
    noteGain.gain.linearRampToValueAtTime(volume * 0.8, now + 0.1);
    
    // Release - fade out
    noteGain.gain.setValueAtTime(volume * 0.8, now + duration - 0.05);
    noteGain.gain.linearRampToValueAtTime(0, now + duration);
    
    // Track this oscillator so we can stop it later
    activeOscillatorsList.push({oscillator, gain: noteGain});
    
    // Start and stop the oscillator
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    console.log(`Note playing: MIDI=${midiNote}, freq=${frequency.toFixed(2)}Hz`);
  } catch (error) {
    console.error('Error playing note:', error);
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