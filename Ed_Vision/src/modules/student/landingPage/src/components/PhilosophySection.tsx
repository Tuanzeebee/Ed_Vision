import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function PhilosophySection() {
  const { t } = useTranslation('student');

  return (
    <section className="bg-white py-28 md:py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl text-[#0D212C] tracking-tighter mb-16 md:mb-24"
        >
          {t('landingV2.philosophy.titlePrefix')}{' '}
          <span className="font-serif-italic italic text-[#0D212C]/40">{t('landingV2.philosophy.titleEmphasis')}</span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="rounded-[2rem] overflow-hidden aspect-[4/3] shadow-lg"
          >
            <video
              className="w-full h-full object-cover"
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-12"
          >
            <div className="h-px bg-[#0D212C]/10 w-full" />
            
            <div className="space-y-4">
              <span className="text-[#0D212C]/40 text-xs tracking-widest uppercase font-semibold">
                {t('landingV2.philosophy.section1Title')}
              </span>
              <p className="text-[#0D212C]/70 text-base md:text-xl leading-relaxed font-medium">
                {t('landingV2.philosophy.section1Body')}
              </p>
            </div>

            <div className="h-px bg-[#0D212C]/10 w-full" />

            <div className="space-y-4">
              <span className="text-[#0D212C]/40 text-xs tracking-widest uppercase font-semibold">
                {t('landingV2.philosophy.section2Title')}
              </span>
              <p className="text-[#0D212C]/70 text-base md:text-xl leading-relaxed font-medium">
                {t('landingV2.philosophy.section2Body')}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
