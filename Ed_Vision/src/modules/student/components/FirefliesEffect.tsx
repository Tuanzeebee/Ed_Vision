import { useMemo, memo } from 'react';

type Props = {
  show: boolean;
};

function FirefliesEffect({ show }: Props) {
  const fireflies = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * -5,
      moveDuration: Math.random() * 8 + 6,
    }));
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {fireflies.map((fly) => (
        <div
          key={fly.id}
          className="absolute rounded-full animate-[firefly-move_ease-in-out_infinite_alternate]"
          style={{
            left: `${fly.left}%`,
            top: `${fly.top}%`,
            width: `${fly.size}px`,
            height: `${fly.size}px`,
            background: 'radial-gradient(circle, #ffff00 0%, #ffcc00 40%, transparent 70%)',
            boxShadow: '0 0 10px 4px rgba(255, 255, 0, 0.5), 0 0 20px 8px rgba(255, 200, 0, 0.3)',
            animationDuration: `${fly.moveDuration}s`,
            animationDelay: `${fly.delay}s`,
          }}
        >
          <div
            className="w-full h-full rounded-full animate-[firefly-glow_ease-in-out_infinite]"
            style={{
              animationDuration: `${fly.duration}s`,
              animationDelay: `${fly.delay}s`,
            }}
          />
        </div>
      ))}
      <style>{`
        @keyframes firefly-glow {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes firefly-move {
          0% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(30px, -20px);
          }
          50% {
            transform: translate(-20px, 30px);
          }
          75% {
            transform: translate(40px, 10px);
          }
          100% {
            transform: translate(-30px, -30px);
          }
        }
      `}</style>
    </div>
  );
}

export default memo(FirefliesEffect);
