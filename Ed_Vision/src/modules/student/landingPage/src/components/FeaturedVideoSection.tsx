import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function FeaturedVideoSection() {
  const { t } = useTranslation('student');

  return (
    <section id="about" className="bg-white pt-24 md:pt-32 pb-20 md:pb-32 px-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.03)_0%,_transparent_70%)] pointer-events-none" />
      <div className="max-w-6xl mx-auto">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="block text-[#0D212C]/40 text-sm tracking-widest uppercase mb-6"
        >
          {t('landingV2.about.label')}
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl text-[#0D212C] leading-[1.1] tracking-tighter"
        >
          <span className="font-serif-italic text-[#0D212C]/60 italic">{t('landingV2.about.titleEmphasis1')}</span>{' '}
          {t('landingV2.about.titleRest1')}
          <br className="hidden md:block" />
          <span className="font-serif-italic text-[#0D212C]/60 italic ml-2">{t('landingV2.about.titleEmphasis2')}</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.9 }}
          className="mt-12 md:mt-16 rounded-[2.5rem] overflow-hidden aspect-video relative group shadow-2xl shadow-black/5"
        >
          <video
            className="w-full h-full object-cover"
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4"
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Bottom Overlay Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pointer-events-none">
            <div className="liquid-glass rounded-3xl p-6 md:p-8 max-w-md pointer-events-auto backdrop-blur-xl">
              <span className="block text-white/60 text-[10px] tracking-widest uppercase mb-3 font-semibold">
                {t('landingV2.featured.label')}
              </span>
              <p className="text-white text-sm md:text-base leading-relaxed">
                {t('landingV2.featured.description')}
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="liquid-glass rounded-full px-8 py-3 text-white text-sm font-medium pointer-events-auto hover:bg-white/10 transition-colors"
            >
              {t('landingV2.featured.cta')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
