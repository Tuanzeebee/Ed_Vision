import { useCallback, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container } from "@tsparticles/engine";

interface SnowfallProps {
  intensity?: "light"| "medium"| "heavy";
}

const Snowfall: React.FC<SnowfallProps>= ({ intensity = "medium"}) => {
  const [init, setInit] = useState(false);

  const particleCount = {
    light: 50,
    medium: 100,
    heavy: 200,
  };

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  if (!init) {
    return null;
  }

  return (
    <Particles
      id="snowfall-particles"options={{
        fullScreen: {
          enable: true,
          zIndex: 1,
        },
        fpsLimit: 60,
        particles: {
          number: {
            value: particleCount[intensity],
            density: {
              enable: true,
            },
          },
          color: {
            value: ["#ffffff", "#e3f2fd", "#bbdefb"],
          },
          shape: {
            type: "circle",
          },
          opacity: {
            value: { min: 0.3, max: 0.8 },
            animation: {
              enable: true,
              speed: 0.5,
              sync: false,
            },
          },
          size: {
            value: { min: 1, max: 5 },
            animation: {
              enable: true,
              speed: 2,
              sync: false,
            },
          },
          move: {
            enable: true,
            speed: { min: 1, max: 3 },
            direction: "bottom",
            random: true,
            straight: false,
            outModes: {
              default: "out",
              top: "none",
              bottom: "out",
            },
            drift: {
              min: -0.5,
              max: 0.5,
            },
          },
          wobble: {
            enable: true,
            distance: 10,
            speed: 5,
          },
          roll: {
            darken: {
              enable: true,
              value: 25,
            },
            enable: true,
            speed: {
              min: 5,
              max: 15,
            },
          },
        },
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "repulse",
            },
          },
          modes: {
            repulse: {
              distance: 100,
              duration: 0.4,
            },
          },
        },
        detectRetina: true,
        smooth: true,
      }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />);
};

export default Snowfall;
