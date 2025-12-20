import { useMemo, memo } from 'react';

type Props = {
  show: boolean;
};

function RainEffect({ show }: Props) {
  // Tạo danh sách hạt mưa cố định để tránh re-render gây giật
  const raindrops = useMemo(() => {
    return Array.from({ length: 150 }, (_, i) => {
      // Tạo sự đa dạng về tốc độ:
      // - Một số hạt rơi rất nhanh (mưa rào)
      // - Một số hạt rơi chậm hơn (mưa bay)
      const baseSpeed = Math.random() * 2 + 1; // 1s - 3s (chậm hơn trước nhiều)
      
      return {
        id: i,
        left: Math.random() * 100,
        height: Math.random() * 20 + 10,
        duration: baseSpeed,
        // Delay âm lớn hơn để đảm bảo mưa phủ kín màn hình ngay lập tức với tốc độ chậm
        delay: Math.random() * -5, 
      };
    });
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {raindrops.map((drop) => (
        <div
          key={drop.id}
          className="absolute -top-10 w-[2px] bg-gradient-to-b from-transparent to-blue-200/60 animate-[rain_linear_infinite]"
          style={{
            left: `${drop.left}%`,
            height: `${drop.height}px`,
            animationDuration: `${drop.duration}s`,
            animationDelay: `${drop.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes rain {
          to {
            transform: translateY(110vh);
          }
        }
      `}</style>
    </div>
  );
}

export default memo(RainEffect);
