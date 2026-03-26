import { useMemo, memo } from 'react';

type Props = {
  show: boolean;
};

function LeavesEffect({ show }: Props) {
  const leaves = useMemo(() => {
    const leafColors = ['#8B4513', '#D2691E', '#CD853F', '#A0522D', '#DEB887', '#F4A460', '#228B22', '#32CD32'];
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 120 - 10,
      size: Math.random() * 15 + 10,
      duration: Math.random() * 8 + 8,
      delay: Math.random() * -10,
      rotate: Math.random() * 360,
      color: leafColors[Math.floor(Math.random() * leafColors.length)],
    }));
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {leaves.map((leaf) => (
        <div
          key={leaf.id}
          className="absolute -top-10 animate-[leaf-fall_linear_infinite]"
          style={{
            left: `${leaf.left}%`,
            animationDuration: `${leaf.duration}s`,
            animationDelay: `${leaf.delay}s`,
          }}
        >
          <svg
            width={leaf.size}
            height={leaf.size}
            viewBox="0 0 24 24"
            className="animate-[leaf-spin_ease-in-out_infinite]"
            style={{
              animationDuration: `${leaf.duration / 2}s`,
              transform: `rotate(${leaf.rotate}deg)`,
            }}
          >
            <path
              d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"
              fill={leaf.color}
            />
          </svg>
        </div>
      ))}
      <style>{`
        @keyframes leaf-fall {
          to {
            transform: translateY(110vh) translateX(50px);
          }
        }
        @keyframes leaf-spin {
          0% {
            transform: rotateZ(0deg) rotateY(0deg);
          }
          25% {
            transform: rotateZ(90deg) rotateY(180deg);
          }
          50% {
            transform: rotateZ(180deg) rotateY(360deg);
          }
          75% {
            transform: rotateZ(270deg) rotateY(180deg);
          }
          100% {
            transform: rotateZ(360deg) rotateY(0deg);
          }
        }
      `}</style>
    </div>
  );
}

export default memo(LeavesEffect);
