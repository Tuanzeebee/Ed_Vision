import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function TestimonialCarousel() {
  const { t } = useTranslation('student');

  const testimonials = useMemo(() => ([
    {
      name: t('landingV2.testimonials.items.0.name'),
      role: t('landingV2.testimonials.items.0.role'),
      text: t('landingV2.testimonials.items.0.text'),
      avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      name: t('landingV2.testimonials.items.1.name'),
      role: t('landingV2.testimonials.items.1.role'),
      text: t('landingV2.testimonials.items.1.text'),
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      name: t('landingV2.testimonials.items.2.name'),
      role: t('landingV2.testimonials.items.2.role'),
      text: t('landingV2.testimonials.items.2.text'),
      avatar: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      name: t('landingV2.testimonials.items.3.name'),
      role: t('landingV2.testimonials.items.3.role'),
      text: t('landingV2.testimonials.items.3.text'),
      avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150"
    },
    {
      name: t('landingV2.testimonials.items.4.name'),
      role: t('landingV2.testimonials.items.4.role'),
      text: t('landingV2.testimonials.items.4.text'),
      avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150"
    }
  ]), [t]);

  const infiniteTestimonials = useMemo(() => (
    [...testimonials, ...testimonials, ...testimonials]
  ), [testimonials]);

  const [index, setIndex] = useState(testimonials.length);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setIndex(prev => prev + 1);
  }, []);

  const prev = useCallback(() => {
    setIndex(prev => prev - 1);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(next, 3000);
    return () => clearInterval(interval);
  }, [next, isPaused]);

  useEffect(() => {
    setIndex(testimonials.length);
  }, [testimonials.length]);

  // Handle wrap around
  useEffect(() => {
    if (index >= testimonials.length * 2) {
      setTimeout(() => setIndex(testimonials.length), 800);
    }
    if (index < testimonials.length) {
      setTimeout(() => setIndex(testimonials.length * 2 - 1), 800);
    }
  }, [index, testimonials.length]);

  return (
    <section className="bg-white py-20 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div className="md:max-w-xl">
            <h2 className="text-4xl md:text-6xl text-[#0D212C] tracking-tighter">
              {t('landingV2.testimonials.titlePrefix')}{' '}
              <span className="font-serif italic text-[#0D212C]/40">{t('landingV2.testimonials.titleEmphasis')}</span>
            </h2>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-[#0D212C] text-[#0D212C]" />
              ))}
            </div>
            <span className="text-sm font-semibold text-[#0D212C]">{t('landingV2.testimonials.rating')}</span>
          </div>
        </div>

        <div 
          className="relative px-2"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div 
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ transform: `translateX(calc(-${index * (427.5 + 24)}px))` }}
          >
            {infiniteTestimonials.map((testimonial, i) => (
              <div 
                key={i}
                className="w-full md:w-[427.5px] flex-shrink-0 px-3 cursor-default"
              >
                <div className="bg-white rounded-[40px] shadow-[0_4px_32px_rgba(0,0,0,0.06)] px-10 py-12 h-full flex flex-col justify-between border border-black/5 hover:border-[#0D212C]/10 transition-colors">
                  <div>
                    <svg width="40" height="32" viewBox="0 0 40 32" fill="none" className="mb-6 opacity-20">
                      <path d="M12.8 32C5.7 32 0 26.3 0 19.2C0 12.1 5.7 6.4 12.8 6.4C13.8 6.4 14.7 6.6 15.6 6.9C14.7 2.8 11.1 0 6.9 0H6.4V6.4H6.9C11.1 6.4 14.5 9.8 14.5 14C14.5 14.1 14.5 14.2 14.5 14.3C13.9 14.1 13.4 14 12.8 14C5.7 14 0 19.7 0 26.8C0 33.9 5.7 39.6 12.8 39.6C19.9 39.6 25.6 33.9 25.6 26.8C25.6 19.7 19.9 14 12.8 14V32Z" fill="#0D212C"/>
                      <path d="M38.4 32C31.3 32 25.6 26.3 25.6 19.2C25.6 12.1 31.3 6.4 38.4 6.4C39.4 6.4 40.3 6.6 41.2 6.9C40.3 2.8 36.7 0 32.5 0H32V6.4H32.5C36.7 6.4 40.1 9.8 40.1 14C40.1 14.1 40.1 14.2 40.1 14.3C39.5 14.1 39 14 38.4 14C31.3 14 25.6 19.7 25.6 26.8C25.6 33.9 31.3 39.6 38.4 39.6C45.5 39.6 51.2 33.9 51.2 26.8C51.2 19.7 45.5 14 38.4 14V32Z" fill="#0D212C"/>
                    </svg>
                    <p className="text-[#0D212C] text-lg leading-relaxed mb-8 font-medium">
                      "{testimonial.text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#0D212C]">{testimonial.name}</h4>
                      <p className="text-xs text-[#0D212C]/40 font-semibold flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="absolute top-1/2 -left-6 -right-6 -translate-y-1/2 flex justify-between pointer-events-none md:px-0">
            <button 
              onClick={prev}
              className="w-12 h-12 rounded-full border border-[#0D212C]/10 bg-white shadow-lg flex items-center justify-center hover:bg-[#0D212C] hover:text-white transition-all pointer-events-auto"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={next}
              className="w-12 h-12 rounded-full border border-[#0D212C]/10 bg-white shadow-lg flex items-center justify-center hover:bg-[#0D212C] hover:text-white transition-all pointer-events-auto"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
