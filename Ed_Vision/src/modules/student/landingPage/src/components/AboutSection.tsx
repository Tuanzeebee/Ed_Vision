import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function AboutSection() {
  const { t } = useTranslation('student');

  return (
    <section className="bg-white pt-32 md:pt-44 pb-10 md:pb-14 px-6 overflow-hidden relative">
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
      </div>
    </section>
  );
}
