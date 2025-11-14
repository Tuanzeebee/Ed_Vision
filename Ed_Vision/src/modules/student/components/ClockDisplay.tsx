import { useState, useEffect } from 'react';

type Props = {
  className?: string;
};

export default function ClockDisplay({ className = '' }: Props) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      setTime(`${displayHours}:${minutes}:${seconds} ${ampm}`);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setDate(`${days[now.getDay()]} | ${now.getDate()} ${months[now.getMonth()]} '${now.getFullYear().toString().slice(-2)}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed top-6 right-6 text-right text-white z-10 ${className}`}>
      <div className="text-3xl font-light tracking-wide drop-shadow-lg">{time}</div>
      <div className="text-sm font-light text-white/80 mt-1 tracking-wide">{date}</div>
      <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-white/40 to-transparent mt-2 ml-auto"></div>
    </div>
  );
}
