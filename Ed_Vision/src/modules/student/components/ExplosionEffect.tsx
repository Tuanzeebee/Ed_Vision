import { useEffect, useState } from 'react';

type Props = {
  visible: boolean;
  onComplete: () => void;
};

export default function ExplosionEffect({ visible, onComplete }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        onComplete();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[100]">
      {/* Boom Text */}
      <div className="relative">
        <div className="text-[12rem] font-black text-white animate-boom-scale drop-shadow-2xl">
          💥
        </div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl font-black text-yellow-300 animate-boom-text drop-shadow-2xl">
          BOOM!
        </div>
      </div>

      {/* Explosion Rings */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-32 h-32 border-8 border-orange-500 rounded-full animate-explosion-ring opacity-0"></div>
      </div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-32 h-32 border-8 border-red-500 rounded-full animate-explosion-ring-delayed opacity-0"></div>
      </div>

      {/* Flash Effect */}
      <div className="absolute inset-0 bg-white animate-flash-boom"></div>
    </div>
  );
}
