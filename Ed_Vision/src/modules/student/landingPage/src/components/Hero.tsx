import React, { useMemo, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const normalizeOptions = (value: unknown, fallback: string) => {
  const list = Array.isArray(value)
    ? value.filter(item => typeof item === 'string' && item.trim().length > 0)
    : typeof value === 'string' && value.trim().length > 0
      ? [value]
      : [];

  if (list.length > 0) return list;
  return fallback ? [fallback] : [];
};

const pickRandomOption = (value: unknown, fallback: string, storageKey: string) => {
  const options = normalizeOptions(value, fallback);
  if (options.length === 0) return '';

  let index = Math.floor(Math.random() * options.length);

  if (options.length > 1 && typeof window !== 'undefined') {
    try {
      const lastIndexRaw = sessionStorage.getItem(storageKey);
      const lastIndex = lastIndexRaw ? Number(lastIndexRaw) : -1;

      if (!Number.isNaN(lastIndex) && lastIndex >= 0 && lastIndex < options.length) {
        while (index === lastIndex) {
          index = Math.floor(Math.random() * options.length);
        }
      }

      sessionStorage.setItem(storageKey, String(index));
    } catch {}
  }

  return options[index];
};

export default function Hero() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('student');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [opacity, setOpacity] = useState(0);
  const heroTitle = useMemo(() => {
    const titleOptions = t('landingV2.hero.titleOptions', { returnObjects: true });
    const fallbackTitle = t('landingV2.hero.titlePrefix');
    const titleStorageKey = `landingV2-hero-title-${i18n.language}`;

    return pickRandomOption(titleOptions, fallbackTitle, titleStorageKey);
  }, [i18n.language, t]);

  const heroDescription = useMemo(() => {
    const descriptionOptions = t('landingV2.hero.descriptionOptions', { returnObjects: true });
    const fallbackDescription = t('landingV2.hero.description');
    const descriptionStorageKey = `landingV2-hero-description-${i18n.language}`;

    return pickRandomOption(descriptionOptions, fallbackDescription, descriptionStorageKey);
  }, [i18n.language, t]);

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
          className="font-serif text-[2.6rem] sm:text-[3.2rem] md:text-[3.2rem] lg:text-[3.9rem] xl:text-[4.8rem] text-white tracking-tight leading-none mb-10"
        >
          {heroTitle}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-white/90 text-sm md:text-base leading-relaxed max-w-lg px-4 mb-10 font-medium drop-shadow-md"
        >
          {heroDescription}
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
