import React from "react";
import { useSeasonalEffect } from "./SeasonalEffectProvider";
import { useAuth } from "@/hooks/useAuth";
import "./SeasonalToggleButton.css";

interface SeasonalToggleButtonProps {
  className?: string;
}

const SeasonalToggleButton: React.FC<SeasonalToggleButtonProps> = ({ className = "" }) => {
  const { currentEvent, isEnabled, toggleEffects } = useSeasonalEffect();
  const { isAuthenticated } = useAuth();

  // Không hiển thị nếu không có event nào đang active HOẶC đã login
  if (currentEvent === "NONE" || isAuthenticated) return null;

  const getIcon = () => {
    switch (currentEvent) {
      case "CHRISTMAS":
        return "❄️";
      case "LUNAR_NEW_YEAR":
        return "🧧";
      case "HALLOWEEN":
        return "🎃";
      case "TEACHER_DAY":
        return "🎓";
      default:
        return "✨";
    }
  };

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggleEffects();
    
    // Dispatch event to trigger music playback after user interaction
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('seasonalEffectToggled', { detail: { enabled: !isEnabled } }));
    }, 100);
  };

  return (
    <button
      className={`seasonal-toggle-btn ${isEnabled ? "active" : ""} ${className}`}
      onClick={handleToggle}
      title={isEnabled ? "Tắt hiệu ứng mùa lễ" : "Bật hiệu ứng mùa lễ"}
      aria-label={isEnabled ? "Disable seasonal effects" : "Enable seasonal effects"}
    >
      {/* Khi ACTIVE (ON): chữ ON ở bên trái, icon ở phải */}
      {/* Khi INACTIVE (OFF): icon ở trái, chữ OFF ở phải */}
      {isEnabled ? (
        <>
          <span className="seasonal-status">ON</span>
          <span className="seasonal-icon">{getIcon()}</span>
        </>
      ) : (
        <>
          <span className="seasonal-icon">{getIcon()}</span>
          <span className="seasonal-status">OFF</span>
        </>
      )}
    </button>
  );
};

export default SeasonalToggleButton;
