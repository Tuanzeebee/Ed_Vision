import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import './index.css';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PhilosophySection from './components/PhilosophySection';
import HowItWorks from './components/HowItWorks';
import ServicesSection from './components/ServicesSection';
import PartnerSection from './components/PartnerSection';
import TestimonialCarousel from './components/TestimonialCarousel';
import Footer from './components/Footer';

export default function App() {
  const navigate = useNavigate();
  const { t } = useTranslation('student');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Basic smooth scroll implementation for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            window.scrollTo({
              top: targetElement.offsetTop,
              behavior: 'smooth'
            });
          }
        }
      });
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('landing-v2-active');
    document.body.classList.add('landing-v2-active');

    return () => {
      document.documentElement.classList.remove('landing-v2-active');
      document.body.classList.remove('landing-v2-active');
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleStartChat = () => {
    navigate('/student/chat-student');
  };

  return (
    <main className="landing-v2 relative flex flex-col w-full min-h-screen font-sans selection:bg-[#0D212C] selection:text-white bg-white">
      <Navbar />
      <Hero />
      <div id="features">
        <ServicesSection />
      </div>
      <HowItWorks />
      <PhilosophySection />
      <TestimonialCarousel />
      <PartnerSection />
      <Footer />
      
      {/* Floating Bottom Nav */}
      <div
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none ${
          isAuthenticated ? 'px-4 w-full max-w-[280px] md:max-w-xs' : 'w-auto'
        }`}
      >
        <div className="liquid-glass rounded-full px-6 py-2.5 flex items-center justify-between pointer-events-auto border border-black/5 shadow-2xl backdrop-blur-2xl bg-white/40">
          <button 
            onClick={scrollToTop}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0D212C]/60 hover:text-[#0D212C] transition-all active:scale-90"
          >
            {t('landingV2.nav.home')}
          </button>
          {isAuthenticated && (
            <>
              <div className="w-px h-4 bg-[#0D212C]/10 mx-2" />
              <button
                type="button"
                onClick={handleStartChat}
                className="liquid-glass-dark rounded-full px-5 py-2 text-white text-[9px] font-bold uppercase tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                {t('landingV2.nav.startChat')}
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

