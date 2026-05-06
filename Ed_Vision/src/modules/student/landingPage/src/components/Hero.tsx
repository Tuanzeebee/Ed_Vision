import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Hero() {
  const navigate = useNavigate();
  const { t } = useTranslation('student');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(0);

  const handleStartNow = () => {
    navigate('/student/instructions');
  };

  const animateOpacity = (target: number, duration: number) => {
    const start = opacity;
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = start + (target - start) * progress;
      setOpacity(current);
      if (videoRef.current) videoRef.current.style.opacity = current.toString();
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      video.play().catch(e => console.log("Autoplay blocked", e));
      animateOpacity(1, 500);
    };

    const handleTimeUpdate = () => {
      const remaining = video.duration - video.currentTime;
      if (remaining <= 0.55 && opacity > 0) {
        animateOpacity(0, 500);
      }
    };

    const handleEnded = () => {
      setOpacity(0);
      if (videoRef.current) videoRef.current.style.opacity = "0";
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().then(() => animateOpacity(1, 500));
        }
      }, 100);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [opacity]);

  return (
    <section className="relative min-h-screen w-full overflow-hidden flex flex-col bg-black">
      {/* Background Video */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover object-bottom transition-opacity duration-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4"
        muted
        autoPlay
        playsInline
        preload="auto"
        style={{ opacity: 0 }}
      />
      
      {/* Dark Overlay for Text Legibility (as video is light) */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-[2%] md:-translate-y-[5%]">
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="font-serif text-6xl md:text-8xl lg:text-[10rem] text-white tracking-tight leading-none mb-10"
        >
          {t('landingV2.hero.titlePrefix')}{' '}
          <em className="italic font-serif-italic">{t('landingV2.hero.titleEmphasis')}</em>
          {t('landingV2.hero.titleSuffix') ? ` ${t('landingV2.hero.titleSuffix')}` : ''}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-white/90 text-sm md:text-base leading-relaxed max-w-lg px-4 mb-10 font-medium drop-shadow-md"
        >
          {t('landingV2.hero.description')}
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium hover:bg-white/10 transition-all active:scale-95"
          onClick={handleStartNow}
        >
          {t('landingV2.hero.cta')}
        </motion.button>
      </div>
    </section>
  );
}
