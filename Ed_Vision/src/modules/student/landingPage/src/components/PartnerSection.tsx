import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  image: string;
}

const marqueeImages = [
  "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=200",
  "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=200",
  "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=200",
  "https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&w=200",
];

export default function PartnerSection() {
  const navigate = useNavigate();
  const { t } = useTranslation('student');
  const { isAuthenticated } = useAuth();
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSpawnTime = useRef(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const now = performance.now();
    if (now - lastSpawnTime.current < 120) return; // Limit spawn rate

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newParticle: Particle = {
      id: now,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      rotation: Math.random() * 20 - 10,
      image: marqueeImages[Math.floor(Math.random() * marqueeImages.length)]
    };

    setParticles(prev => [...prev.slice(-15), newParticle]);
    lastSpawnTime.current = now;

    // Auto cleanup after 1s
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticle.id));
    }, 1000);
  };

  const handleStartChat = () => {
    navigate('/student/chat-student');
  };

  return (
    <section className="bg-white py-12 px-6">
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="max-w-7xl mx-auto py-48 bg-slate-50 rounded-[40px] relative overflow-hidden flex flex-col items-center justify-center border border-black/5 shadow-xl shadow-black/5"
      >
        {/* GIF Particles Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <AnimatePresence>
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.2, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 1 }}
                style={{
                  position: 'absolute',
                  left: particle.x - 60,
                  top: particle.y - 60,
                  rotate: particle.rotation,
                  width: 120,
                  height: 120,
                  borderRadius: '12px',
                  backgroundImage: `url(${particle.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="relative z-10 text-center">
          <h2 className="text-[48px] md:text-[64px] lg:text-[80px] font-serif tracking-tight leading-none text-[#0D212C] mb-12">
            {t('landingV2.partner.title')}
          </h2>

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleStartChat}
              className="liquid-glass-dark rounded-full px-7 py-3 text-white flex items-center gap-3 group transition-all hover:scale-105 active:scale-95 shadow-2xl"
            >
              <img 
                src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150" 
                alt="Viktor"
                className="w-8 h-8 rounded-full object-cover border border-white/20"
              />
              <span className="font-medium text-sm">{t('landingV2.partner.cta')}</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
