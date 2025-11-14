type Props = {
  show: boolean;
};

export default function RainEffect({ show }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 animate-[rain-fall_0.5s_linear_infinite]"></div>
      <style>{`
        @keyframes rain-fall {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
