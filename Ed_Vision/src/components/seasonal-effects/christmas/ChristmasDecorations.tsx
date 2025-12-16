import React, { useState, useEffect } from "react";
import "./ChristmasDecorations.css";

const ChristmasDecorations: React.FC = () => {
  const [santaPosition, setSantaPosition] = useState(-200);
  const [showSanta, setShowSanta] = useState(false);

  // Ông già Noel chạy ngang màn hình
  useEffect(() => {
    const runSanta = () => {
      setShowSanta(true);
      setSantaPosition(-200);
      
      const animation = setInterval(() => {
        setSantaPosition(prev => {
          if (prev > window.innerWidth + 200) {
            clearInterval(animation);
            setShowSanta(false);
            return -200;
          }
          return prev + 4;
        });
      }, 16);
    };

    // Chạy lần đầu sau 2 giây
    const firstRun = setTimeout(runSanta, 2000);
    
    // Sau đó chạy mỗi 40 giây
    const interval = setInterval(runSanta, 40000);

    return () => {
      clearTimeout(firstRun);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {/* Xóa trang trí góc trái trên và phải trên */}
      
      {/* Góc trái dưới - Người tuyết TĂNG KÍCH THƯỚC */}
      <div className="xmas-deco xmas-deco--bottom-left">
        <svg viewBox="0 0 100 140" className="xmas-snowman">
          {/* Thân dưới - TĂNG GẤP ĐÔI */}
          <ellipse cx="50" cy="116" rx="32" ry="24" fill="#ffffff" stroke="#e8e8e8" strokeWidth="2"/>
          {/* Thân giữa */}
          <ellipse cx="50" cy="84" rx="24" ry="20" fill="#ffffff" stroke="#e8e8e8" strokeWidth="2"/>
          {/* Đầu */}
          <circle cx="50" cy="52" r="20" fill="#ffffff" stroke="#e8e8e8" strokeWidth="2"/>
          
          {/* Mũ đen */}
          <rect x="34" y="24" width="32" height="20" fill="#2c2c2c" rx="2"/>
          <rect x="26" y="40" width="48" height="6" fill="#2c2c2c" rx="2"/>
          <rect x="38" y="26" width="6" height="14" fill="#c41e3a"/>
          
          {/* Mặt */}
          <circle cx="42" cy="48" r="3" fill="#1a1a1a"/>
          <circle cx="58" cy="48" r="3" fill="#1a1a1a"/>
          <polygon points="50,54 50,58 62,56" fill="#ff7043"/>
          
          {/* Miệng cười */}
          <path d="M40,64 Q50,70 60,64" stroke="#1a1a1a" strokeWidth="3" fill="none" strokeLinecap="round"/>
          
          {/* Khăn quàng */}
          <path d="M30,72 Q50,80 70,72" stroke="#c41e3a" strokeWidth="8" fill="none" strokeLinecap="round"/>
          <rect x="64" y="72" width="10" height="24" fill="#c41e3a" rx="4"/>
          <path d="M64,96 L68,100 M70,96 L74,100" stroke="#8b0000" strokeWidth="2"/>
          
          {/* Cúc áo */}
          <circle cx="50" cy="92" r="4" fill="#1a1a1a"/>
          <circle cx="50" cy="108" r="4" fill="#1a1a1a"/>
          
          {/* Tay gậy - TĂNG KÍCH THƯỚC */}
          <line x1="16" y1="84" x2="30" y2="80" stroke="#8b4513" strokeWidth="4" strokeLinecap="round"/>
          <line x1="70" y1="80" x2="84" y2="84" stroke="#8b4513" strokeWidth="4" strokeLinecap="round"/>
          <line x1="10" y1="76" x2="16" y2="84" stroke="#8b4513" strokeWidth="4" strokeLinecap="round"/>
          <line x1="10" y1="90" x2="16" y2="84" stroke="#8b4513" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Góc phải dưới - Cây thông TĂNG KÍCH THƯỚC */}
      <div className="xmas-deco xmas-deco--bottom-right">
        <svg viewBox="0 0 120 150" className="xmas-tree-gifts">
          {/* Cây thông - TĂNG GẤP ĐÔI */}
          <polygon points="60,10 36,50 84,50" fill="#1e5631"/>
          <polygon points="60,30 28,76 92,76" fill="#2d7a3d"/>
          <polygon points="60,56 20,110 100,110" fill="#1e5631"/>
          <rect x="50" y="110" width="20" height="16" fill="#8b4513"/>
          
          {/* Ngôi sao */}
          <polygon points="60,4 62,12 70,12 64,18 66,26 60,20 54,26 56,18 50,12 58,12" fill="#ffd700" className="tree-star-glow"/>
          
          {/* Đồ trang trí nhỏ - TĂNG KÍCH THƯỚC */}
          <circle cx="50" cy="40" r="5" fill="#ff0000"/>
          <circle cx="70" cy="44" r="5" fill="#ffd700"/>
          <circle cx="40" cy="66" r="5" fill="#00bfff"/>
          <circle cx="80" cy="70" r="5" fill="#ff0000"/>
          <circle cx="60" cy="64" r="5" fill="#32cd32"/>
          <circle cx="32" cy="96" r="5" fill="#ffd700"/>
          <circle cx="88" cy="100" r="5" fill="#ff69b4"/>
          
          {/* Hộp quà 1 - TĂNG KÍCH THƯỚC */}
          <rect x="6" y="120" width="28" height="24" fill="#c41e3a" rx="2"/>
          <rect x="16" y="120" width="8" height="24" fill="#ffd700"/>
          <rect x="6" y="128" width="28" height="6" fill="#ffd700"/>
          <ellipse cx="20" cy="120" rx="8" ry="4" fill="#ffd700"/>
          
          {/* Hộp quà 2 - TĂNG KÍCH THƯỚC */}
          <rect x="86" y="124" width="24" height="20" fill="#2196f3" rx="2"/>
          <rect x="94" y="124" width="6" height="20" fill="#e0e0e0"/>
          <rect x="86" y="132" width="24" height="4" fill="#e0e0e0"/>
          <ellipse cx="98" cy="124" rx="6" ry="3" fill="#e0e0e0"/>
        </svg>
      </div>

      {/* Ông già Noel với tuần lộc chạy ngang */}
      {showSanta && (
        <div 
          className="santa-sleigh-container"
          style={{ transform: `translateX(${santaPosition}px) scaleX(-1)` }}
        >
          <svg viewBox="0 0 180 55" className="santa-sleigh-svg">
            {/* Tuần lộc Rudolph */}
            <g className="reindeer" transform="translate(0, 8)">
              {/* Thân */}
              <ellipse cx="28" cy="28" rx="18" ry="12" fill="#8b4513"/>
              {/* Chân chạy */}
              <g className="reindeer-legs">
                <line x1="15" y1="38" x2="10" y2="48" stroke="#5d3a1a" strokeWidth="3" strokeLinecap="round"/>
                <line x1="22" y1="40" x2="18" y2="50" stroke="#5d3a1a" strokeWidth="3" strokeLinecap="round"/>
                <line x1="34" y1="40" x2="38" y2="50" stroke="#5d3a1a" strokeWidth="3" strokeLinecap="round"/>
                <line x1="41" y1="38" x2="46" y2="48" stroke="#5d3a1a" strokeWidth="3" strokeLinecap="round"/>
              </g>
              {/* Đầu */}
              <ellipse cx="8" cy="22" rx="10" ry="8" fill="#a0522d"/>
              {/* Sừng */}
              <path d="M3,14 L-2,6 M3,14 L0,4 M3,14 L5,5" stroke="#4a3020" strokeWidth="2" fill="none" strokeLinecap="round"/>
              <path d="M13,14 L18,6 M13,14 L16,4 M13,14 L11,5" stroke="#4a3020" strokeWidth="2" fill="none" strokeLinecap="round"/>
              {/* Tai */}
              <ellipse cx="0" cy="18" rx="3" ry="5" fill="#a0522d" transform="rotate(-20 0 18)"/>
              <ellipse cx="16" cy="18" rx="3" ry="5" fill="#a0522d" transform="rotate(20 16 18)"/>
              {/* Mũi đỏ phát sáng */}
              <circle cx="0" cy="25" r="4" fill="#ff0000" className="rudolph-nose-glow"/>
              <circle cx="0" cy="25" r="3" fill="#ff3333"/>
              {/* Mắt */}
              <circle cx="4" cy="20" r="2" fill="#1a1a1a"/>
              <circle cx="4" cy="19" r="0.8" fill="#fff"/>
              {/* Dây cương */}
              <path d="M46,28 L60,25" stroke="#8b0000" strokeWidth="2"/>
              <path d="M46,32 L60,32" stroke="#8b0000" strokeWidth="2"/>
            </g>
            
            {/* Xe trượt tuyết */}
            <g transform="translate(58, 12)">
              {/* Thân xe màu đỏ */}
              <path d="M0,25 Q5,15 18,15 L85,15 Q95,15 100,25 L100,38 Q95,42 85,42 L18,42 Q5,42 0,38 Z" fill="#c41e3a"/>
              <path d="M8,20 L92,20 L92,38 L8,38 Z" fill="#a01830"/>
              {/* Viền vàng */}
              <path d="M5,18 L95,18" stroke="#ffd700" strokeWidth="2"/>
              <path d="M5,40 L95,40" stroke="#ffd700" strokeWidth="2"/>
              {/* Thanh trượt cong */}
              <path d="M-5,45 Q0,42 10,42 L95,42 Q105,42 110,45 L112,48 Q110,52 100,52 L5,52 Q-5,52 -8,48 Z" fill="#ffd700"/>
              <path d="M-3,47 L108,47" stroke="#daa520" strokeWidth="1"/>
            </g>
            
            {/* Ông già Noel */}
            <g transform="translate(75, 0)">
              {/* Túi quà đằng sau */}
              <ellipse cx="65" cy="32" rx="18" ry="22" fill="#8b4513"/>
              <ellipse cx="65" cy="32" rx="16" ry="20" fill="#704214"/>
              <path d="M52,15 Q65,8 78,15" stroke="#5a3010" strokeWidth="3" fill="none" strokeLinecap="round"/>
              {/* Quà trong túi */}
              <rect x="55" y="18" width="8" height="6" fill="#c41e3a" rx="1"/>
              <rect x="62" y="20" width="6" height="5" fill="#2196f3" rx="1"/>
              <rect x="57" y="26" width="7" height="5" fill="#4caf50" rx="1"/>
              
              {/* Thân ông già Noel */}
              <ellipse cx="38" cy="35" rx="14" ry="18" fill="#c41e3a"/>
              {/* Thắt lưng */}
              <rect x="24" y="38" width="28" height="6" fill="#1a1a1a"/>
              <rect x="34" y="37" width="8" height="8" fill="#ffd700" rx="1"/>
              
              {/* Đầu */}
              <circle cx="38" cy="12" r="11" fill="#ffdab9"/>
              
              {/* Râu trắng */}
              <ellipse cx="38" cy="20" rx="10" ry="8" fill="#ffffff"/>
              <ellipse cx="28" cy="15" rx="5" ry="4" fill="#ffffff"/>
              <ellipse cx="48" cy="15" rx="5" ry="4" fill="#ffffff"/>
              <path d="M28,22 Q38,30 48,22" fill="#ffffff"/>
              
              {/* Mũ đỏ */}
              <path d="M27,12 Q27,0 38,-2 Q49,0 49,12" fill="#c41e3a"/>
              <ellipse cx="38" cy="12" rx="13" ry="4" fill="#ffffff"/>
              <circle cx="52" cy="-2" r="5" fill="#ffffff"/>
              
              {/* Mắt */}
              <circle cx="33" cy="10" r="2" fill="#1a1a1a"/>
              <circle cx="43" cy="10" r="2" fill="#1a1a1a"/>
              <circle cx="34" cy="9" r="0.8" fill="#fff"/>
              <circle cx="44" cy="9" r="0.8" fill="#fff"/>
              
              {/* Má hồng */}
              <circle cx="28" cy="14" r="3" fill="#ffb6c1" opacity="0.5"/>
              <circle cx="48" cy="14" r="3" fill="#ffb6c1" opacity="0.5"/>
              
              {/* Mũi */}
              <circle cx="38" cy="14" r="3" fill="#ffb6b6"/>
              
              {/* Tay vẫy */}
              <g className="santa-arm-wave">
                <ellipse cx="20" cy="28" rx="6" ry="5" fill="#c41e3a"/>
                <circle cx="15" cy="26" r="5" fill="#ffdab9"/>
                <circle cx="13" cy="24" r="1" fill="#ffdab9"/>
                <circle cx="15" cy="23" r="1" fill="#ffdab9"/>
                <circle cx="17" cy="24" r="1" fill="#ffdab9"/>
              </g>
              
              {/* Tay cầm dây cương */}
              <ellipse cx="56" cy="32" rx="5" ry="4" fill="#c41e3a"/>
              <circle cx="58" cy="30" r="4" fill="#ffdab9"/>
            </g>
          </svg>
        </div>
      )}
    </>
  );
};

export default ChristmasDecorations;
