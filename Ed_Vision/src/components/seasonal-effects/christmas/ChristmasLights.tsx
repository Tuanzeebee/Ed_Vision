import React from "react";
import "./ChristmasLights.css";

interface ChristmasLightsProps {
  position?: "top"| "bottom";
}

const ChristmasLights: React.FC<ChristmasLightsProps>= ({ position = "top"}) => {
  const colors = ["#ff0000", "#00ff00", "#0066ff", "#ffff00", "#ff00ff", "#00ffff"];
  const lightsCount = 30;

  return (
    <div className={`christmas-lights christmas-lights--${position}`}>
      <div className="lights-wire">
        {Array.from({ length: lightsCount }).map((_, index) =>(
          <div
            key={index}
            className="light-bulb"style={{
              "--bulb-color": colors[index % colors.length],
              "--animation-delay": `${(index * 0.1) % 1}s`,
            } as React.CSSProperties}
          >
            <div className="bulb-glow"/>
          </div>))}
      </div>
    </div>);
};

export default ChristmasLights;
