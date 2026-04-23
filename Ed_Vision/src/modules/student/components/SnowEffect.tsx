import { useMemo, memo } from 'react';

type Props = {
  show: boolean;
};

function SnowEffect({ show }: Props) {
  // Dùng useMemo để tính toán vị trí tuyết 1 lần duy nhất lúc mount
  const snowflakes = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => {
      const isVertical = Math.random() >0.5; // 50% rơi thẳng, 50% rơi chéo (gió thổi)
      
      return {
        id: i,
        isVertical,
        // Random vị trí ngang ban đầu
        // Nếu rơi chéo thì cho phép xuất phát từ bên trái màn hình (âm) để phủ kín hơn
        left: Math.random() * 120 - 20, // Từ -20% đến 100%
        size: Math.random() * 5 + 5,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * -20,
      };
    });
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      {snowflakes.map((flake) =>(
        <div
          key={flake.id}
          className={`absolute -top-5 bg-white rounded-full opacity-80 ${
            flake.isVertical ? 'animate-[fall_linear_infinite]': 'animate-[drift_linear_infinite]'}`}
          style={{
            left: `${flake.left}%`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            animationDuration: `${flake.duration}s`,
            animationDelay: `${flake.delay}s`,
          }}
        />))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(110vh);
          }
        }
        @keyframes drift {
          to {
            /* Rơi xuống dưới và bay sang phải 50vw (chéo chéo) */
            transform: translate(50vw, 110vh);
          }
        }
      `}</style>
    </div>);
}

export default memo(SnowEffect);
