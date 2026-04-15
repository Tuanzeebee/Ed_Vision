import { useEffect, useState } from 'react';

type Props = {
  visible: boolean;
  onComplete: () =>void;
};

export default function ConfettiEffect({ visible, onComplete }: Props) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number; delay: number }>>([]);

  useEffect(() => {
    if (visible) {
      // Generate confetti particles
      const newParticles = Array.from({ length: 50 }, (_, i) =>({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a8e6cf', '#ff8b94', '#c7ceea'][Math.floor(Math.random() * 6)],
        rotation: Math.random() * 360,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);

      // Clear after animation
      const timer = setTimeout(() => {
        setParticles([]);
        onComplete();
      }, 3000);

      return () =>clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((particle) =>(
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-confetti-fall"style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            animationDelay: `${particle.delay}s`,
          }}
        />))}
    </div>);
}
