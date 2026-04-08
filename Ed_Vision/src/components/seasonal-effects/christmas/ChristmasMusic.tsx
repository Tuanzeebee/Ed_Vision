import { useEffect, useRef } from 'react';

interface ChristmasMusicProps {
  volume?: number; // 0.0 to 1.0
}

const ChristmasMusic: React.FC<ChristmasMusicProps> = ({ volume = 0.4 }) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const playMelodyRef = useRef<(() => void) | null>(null);
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const masterGain = audioContext.createGain();
    masterGain.gain.value = volume * 2.5;
    masterGain.connect(audioContext.destination);
    gainNodeRef.current = masterGain;

      // Full Jingle Bells melody + additional Christmas songs (3-4 minutes total)
      const melody = [
        // === JINGLE BELLS - Part 1 ===
        // "Jingle bells, jingle bells, jingle all the way"
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.5 },  // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.5 },  // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 392.00, duration: 0.25 }, // G
        { note: 261.63, duration: 0.375 }, // C
        { note: 293.66, duration: 0.125 }, // D
        { note: 329.63, duration: 1.0 },  // E
        
        // "Oh what fun it is to ride"
        { note: 349.23, duration: 0.25 }, // F
        { note: 349.23, duration: 0.25 }, // F
        { note: 349.23, duration: 0.375 }, // F
        { note: 349.23, duration: 0.125 }, // F
        { note: 349.23, duration: 0.25 }, // F
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.125 }, // E
        { note: 329.63, duration: 0.125 }, // E
        
        // "In a one horse open sleigh, hey!"
        { note: 329.63, duration: 0.25 }, // E
        { note: 293.66, duration: 0.25 }, // D
        { note: 293.66, duration: 0.25 }, // D
        { note: 329.63, duration: 0.25 }, // E
        { note: 293.66, duration: 0.5 },  // D
        { note: 392.00, duration: 0.5 },  // G
        { note: 0, duration: 0.25 },      // Rest
        
        // Repeat chorus
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.5 },  // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.5 },  // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 392.00, duration: 0.25 }, // G
        { note: 261.63, duration: 0.375 }, // C
        { note: 293.66, duration: 0.125 }, // D
        { note: 329.63, duration: 1.0 },  // E
        
        { note: 349.23, duration: 0.25 }, // F
        { note: 349.23, duration: 0.25 }, // F
        { note: 349.23, duration: 0.375 }, // F
        { note: 349.23, duration: 0.125 }, // F
        { note: 349.23, duration: 0.25 }, // F
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        
        { note: 392.00, duration: 0.25 }, // G
        { note: 392.00, duration: 0.25 }, // G
        { note: 349.23, duration: 0.25 }, // F
        { note: 293.66, duration: 0.25 }, // D
        { note: 261.63, duration: 1.0 },  // C
        { note: 0, duration: 0.5 },       // Rest
        
        // === WE WISH YOU A MERRY CHRISTMAS ===
        { note: 261.63, duration: 0.3 }, // C
        { note: 349.23, duration: 0.3 }, // F
        { note: 349.23, duration: 0.15 }, // F
        { note: 392.00, duration: 0.15 }, // G
        { note: 349.23, duration: 0.3 }, // F
        { note: 329.63, duration: 0.3 }, // E
        
        { note: 293.66, duration: 0.3 }, // D
        { note: 293.66, duration: 0.3 }, // D
        { note: 392.00, duration: 0.3 }, // G
        { note: 392.00, duration: 0.15 }, // G
        { note: 440.00, duration: 0.15 }, // A
        { note: 392.00, duration: 0.3 }, // G
        { note: 349.23, duration: 0.3 }, // F
        
        { note: 329.63, duration: 0.3 }, // E
        { note: 261.63, duration: 0.3 }, // C
        { note: 293.66, duration: 0.3 }, // D
        { note: 392.00, duration: 0.3 }, // G
        { note: 329.63, duration: 0.3 }, // E
        { note: 349.23, duration: 0.6 }, // F
        { note: 0, duration: 0.4 },      // Rest
        
        // === DECK THE HALLS ===
        { note: 349.23, duration: 0.3 }, // F
        { note: 329.63, duration: 0.15 }, // E
        { note: 293.66, duration: 0.15 }, // D
        { note: 261.63, duration: 0.3 }, // C
        { note: 293.66, duration: 0.3 }, // D
        { note: 329.63, duration: 0.3 }, // E
        { note: 261.63, duration: 0.6 }, // C
        
        { note: 293.66, duration: 0.3 }, // D
        { note: 329.63, duration: 0.3 }, // E
        { note: 349.23, duration: 0.15 }, // F
        { note: 329.63, duration: 0.15 }, // E
        { note: 293.66, duration: 0.3 }, // D
        { note: 261.63, duration: 0.3 }, // C
        { note: 0, duration: 0.3 },      // Rest
        
        // === JINGLE BELLS - Variation ===
        { note: 329.63, duration: 0.2 }, // E (faster)
        { note: 329.63, duration: 0.2 }, // E
        { note: 329.63, duration: 0.4 },  // E
        { note: 329.63, duration: 0.2 }, // E
        { note: 329.63, duration: 0.2 }, // E
        { note: 329.63, duration: 0.4 },  // E
        { note: 329.63, duration: 0.2 }, // E
        { note: 392.00, duration: 0.2 }, // G
        { note: 261.63, duration: 0.3 }, // C
        { note: 293.66, duration: 0.1 }, // D
        { note: 329.63, duration: 0.8 },  // E
        
        { note: 349.23, duration: 0.2 }, // F
        { note: 349.23, duration: 0.2 }, // F
        { note: 349.23, duration: 0.3 }, // F
        { note: 349.23, duration: 0.1 }, // F
        { note: 349.23, duration: 0.2 }, // F
        { note: 329.63, duration: 0.2 }, // E
        { note: 329.63, duration: 0.2 }, // E
        { note: 392.00, duration: 0.2 }, // G
        { note: 392.00, duration: 0.2 }, // G
        { note: 349.23, duration: 0.2 }, // F
        { note: 293.66, duration: 0.2 }, // D
        { note: 261.63, duration: 0.8 },  // C
        { note: 0, duration: 0.5 },       // Rest
        
        // === SILENT NIGHT (slower, peaceful section) ===
        { note: 392.00, duration: 0.6 }, // G
        { note: 440.00, duration: 0.3 }, // A
        { note: 392.00, duration: 0.6 }, // G
        { note: 329.63, duration: 1.2 }, // E
        
        { note: 392.00, duration: 0.6 }, // G
        { note: 440.00, duration: 0.3 }, // A
        { note: 392.00, duration: 0.6 }, // G
        { note: 329.63, duration: 1.2 }, // E
        
        { note: 293.66, duration: 0.6 }, // D
        { note: 293.66, duration: 0.6 }, // D
        { note: 493.88, duration: 1.2 }, // B
        
        { note: 261.63, duration: 0.6 }, // C
        { note: 261.63, duration: 0.6 }, // C
        { note: 392.00, duration: 1.2 }, // G
        { note: 0, duration: 0.6 },      // Rest
        
        // === JINGLE BELLS - Final Chorus (energetic) ===
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.5 },  // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.5 },  // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 392.00, duration: 0.25 }, // G
        { note: 261.63, duration: 0.375 }, // C
        { note: 293.66, duration: 0.125 }, // D
        { note: 329.63, duration: 1.0 },  // E
        
        { note: 349.23, duration: 0.25 }, // F
        { note: 349.23, duration: 0.25 }, // F
        { note: 349.23, duration: 0.375 }, // F
        { note: 349.23, duration: 0.125 }, // F
        { note: 349.23, duration: 0.25 }, // F
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        { note: 329.63, duration: 0.25 }, // E
        
        { note: 392.00, duration: 0.25 }, // G
        { note: 392.00, duration: 0.25 }, // G
        { note: 349.23, duration: 0.25 }, // F
        { note: 293.66, duration: 0.25 }, // D
        { note: 261.63, duration: 1.5 },  // C (longer ending)
        { note: 0, duration: 1.0 },       // Final rest
      ];

      // Piano bell sound (cleaner and more pleasant)
      const createBellSound = (startTime: number, intensity: number = 1) => {
        // High piano notes (C7, E7, G7) - creates a pleasant chime
        const pianoNotes = [2093, 2637, 3136]; // C7, E7, G7
        
        pianoNotes.forEach((freq, i) => {
          // Fundamental frequency
          const osc = audioContext.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          const bellGain = audioContext.createGain();
          const gainValue = (0.25 * intensity) / (i + 1);
          bellGain.gain.setValueAtTime(0, startTime);
          bellGain.gain.linearRampToValueAtTime(gainValue, startTime + 0.005); // Sharp attack
          bellGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4); // Longer decay
          
          osc.connect(bellGain);
          bellGain.connect(gainNodeRef.current!);
          
          osc.start(startTime);
          osc.stop(startTime + 0.4);

          // Add harmonics for piano-like timbre
          [2, 3].forEach((harmonic, h) => {
            const harmonicOsc = audioContext.createOscillator();
            harmonicOsc.type = 'sine';
            harmonicOsc.frequency.value = freq * harmonic;
            
            const harmonicGain = audioContext.createGain();
            const harmonicValue = gainValue / (harmonic * 3);
            harmonicGain.gain.setValueAtTime(0, startTime);
            harmonicGain.gain.linearRampToValueAtTime(harmonicValue, startTime + 0.005);
            harmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
            
            harmonicOsc.connect(harmonicGain);
            harmonicGain.connect(gainNodeRef.current!);
            
            harmonicOsc.start(startTime);
            harmonicOsc.stop(startTime + 0.3);
          });
        });
      };

      // Add bass/harmony for richness
      const createBass = (startTime: number, freq: number, duration: number) => {
        const bassOsc = audioContext.createOscillator();
        bassOsc.type = 'triangle';
        bassOsc.frequency.value = freq / 2; // One octave lower
        
        const bassGain = audioContext.createGain();
        bassGain.gain.setValueAtTime(0, startTime);
        bassGain.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
        bassGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        bassOsc.connect(bassGain);
        bassGain.connect(gainNodeRef.current!);
        
        bassOsc.start(startTime);
        bassOsc.stop(startTime + duration);
      };

      let loopTime = 0;

      const playMelody = () => {
        if (!audioContextRef.current || !gainNodeRef.current) return;
        
        const baseTime = audioContext.currentTime + loopTime;
        let currentTime = baseTime;

        melody.forEach(({ note, duration }, index) => {
          if (note > 0) {
            const oscillator = audioContext.createOscillator();
            oscillator.type = 'triangle';
            oscillator.frequency.value = note;
            
            const noteGain = audioContext.createGain();
            noteGain.gain.setValueAtTime(0, currentTime);
            noteGain.gain.linearRampToValueAtTime(0.5, currentTime + 0.01);
            noteGain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
            
            oscillator.connect(noteGain);
            noteGain.connect(gainNodeRef.current!);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + duration);

            if (index % 4 === 0) {
              createBass(currentTime, note, duration);
            }

            if (index % 2 === 0 || duration >= 0.5) {
              const intensity = duration >= 0.5 ? 1.5 : 1;
              createBellSound(currentTime, intensity);
            }
          }
          currentTime += duration;
        });

        const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
        loopTime += totalDuration;
        
        setTimeout(() => playMelody(), totalDuration * 1000);
      };

      playMelodyRef.current = playMelody;

      const unlockAudio = async () => {
        if (audioUnlockedRef.current) return;

        try {
          await audioContext.resume();
          audioUnlockedRef.current = true;
          
          if (!isPlayingRef.current && audioContext.state === 'running') {
            isPlayingRef.current = true;
            playMelody();
          }
          
          document.removeEventListener('click', unlockAudio);
        } catch (error) {
          // Silent fail
        }
      };

      document.addEventListener('click', unlockAudio);

      if (audioContext.state === 'running') {
        audioUnlockedRef.current = true;
        isPlayingRef.current = true;
        playMelody();
      } else {
        audioContext.resume().then(() => {
          if (audioContext.state === 'running') {
            audioUnlockedRef.current = true;
            isPlayingRef.current = true;
            playMelody();
          }
        }).catch(() => {
          // Silent fail
        });
      }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      isPlayingRef.current = false;
      audioUnlockedRef.current = false;
    };
  }, [volume]);

  return null; // No UI, just audio
};

export default ChristmasMusic;
