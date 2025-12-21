import { useMemo, memo } from 'react';

type Props = {
  show: boolean;
};

function CloudsEffect({ show }: Props) {
  const clouds = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i,
      top: Math.random() * 40 + 5,
      size: Math.random() * 100 + 80,
      duration: Math.random() * 40 + 40,
      delay: Math.random() * -30,
      opacity: Math.random() * 0.3 + 0.2,
    }));
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute -left-40 animate-[cloud-drift_linear_infinite]"
          style={{
            top: `${cloud.top}%`,
            animationDuration: `${cloud.duration}s`,
            animationDelay: `${cloud.delay}s`,
          }}
        >
          <svg
            width={cloud.size}
            height={cloud.size * 0.6}
            viewBox="0 0 100 60"
            style={{ opacity: cloud.opacity }}
          >
            <ellipse cx="30" cy="40" rx="25" ry="15" fill="white" />
            <ellipse cx="50" cy="35" rx="30" ry="20" fill="white" />
            <ellipse cx="70" cy="40" rx="25" ry="15" fill="white" />
            <ellipse cx="40" cy="25" rx="20" ry="15" fill="white" />
            <ellipse cx="60" cy="25" rx="20" ry="15" fill="white" />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes cloud-drift {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(100vw + 200px));
          }
        }
      `}</style>
    </div>
  );
}

export default memo(CloudsEffect);
