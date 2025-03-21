class AudioContext {
  private static instance: AudioContext;
  private audioContext: globalThis.AudioContext | null = null;

  private constructor() {}

  static getInstance(): AudioContext {
    if (!AudioContext.instance) {
      AudioContext.instance = new AudioContext();
    }
    return AudioContext.instance;
  }

  private getContext(): globalThis.AudioContext {
    if (!this.audioContext) {
      this.audioContext = new window.AudioContext();
    }
    return this.audioContext;
  }

  playNote(frequency: number): void {
    const context = this.getContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1);

    oscillator.start();
    oscillator.stop(context.currentTime + 1);
  }
}

export const audioContext = AudioContext.getInstance(); 