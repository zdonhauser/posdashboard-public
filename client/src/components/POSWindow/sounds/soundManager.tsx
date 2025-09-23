// Define a union type for available sounds
type SoundName = 
  | 'add'
  | 'block1'
  | 'block2'
  | 'bloop1'
  | 'bloop2'
  | 'bloop3'
  | 'chaching'
  | 'pop1'
  | 'pop2'
  | 'pop3'
  | 'pop4'
  | 'pop5'
  | 'pop6'
  | 'pop7'
  | 'pop8'
  | 'pop9';

class SoundManager {
  private static instance: SoundManager;
  private sounds: { [key in SoundName]?: HTMLAudioElement } = {};

  private constructor() {
    if (SoundManager.instance) {
      return SoundManager.instance;
    }
    SoundManager.instance = this;

    // Load sounds from a configuration object
    const soundConfig: { [key in SoundName]: string } = {
      'add': '/sounds/add.mp3',
      'block1': '/sounds/block1.mp3',
      'block2': '/sounds/block2.mp3',
      'bloop1': '/sounds/bloop1.mp3',
      'bloop2': '/sounds/bloop2.mp3',
      'bloop3': '/sounds/bloop3.mp3',
      'chaching': '/sounds/chaching.mp3', // Corrected typo from 'caching' to 'chaching'
      'pop1': '/sounds/pop1.mp3',
      'pop2': '/sounds/pop2.mp3',
      'pop3': '/sounds/pop3.mp3',
      'pop4': '/sounds/pop4.mp3',
      'pop5': '/sounds/pop5.mp3',
      'pop6': '/sounds/pop6.mp3',
      'pop7': '/sounds/pop7.mp3',
      'pop8': '/sounds/pop8.mp3',
      'pop9': '/sounds/pop9.mp3',
    };

    for (const [soundName, filePath] of Object.entries(soundConfig)) {
      this.loadSound(soundName as SoundName, filePath);
    }
  }

  // Method to lazily load a sound
  private loadSound(soundName: SoundName, filePath: string) {
    if (!this.sounds[soundName]) {
      const sound = new Audio(filePath);
      sound.onerror = () => {
        console.error(`Error loading sound file: ${filePath}`);
      };
      sound.load(); // Preload the sound
      this.sounds[soundName] = sound;
    }
  }

  // Method to play a sound, restarts the sound from t=0
  public play(soundName: SoundName) {
    const sound = this.sounds[soundName];
    if (!sound) {
      console.error(`Sound ${soundName} not found!`);
      return;
    }
    sound.pause();
    sound.currentTime = 0;
    sound.play().catch((err) => console.error(`Failed to play sound ${soundName}:`, err));
  }

  // Optional: Set the volume for a specific sound
  public setVolume(soundName: SoundName, volume: number) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.volume = volume;
    }
  }

  // Optional: Mute or unmute a specific sound
  public mute(soundName: SoundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.muted = true;
    }
  }

  public unmute(soundName: SoundName) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.muted = false;
    }
  }

  // Optional: Singleton instance accessor
  public static getInstance() {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }
}

export const soundManager = SoundManager.getInstance();
