import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function HowItWorks() {
  const { t } = useTranslation('student');

  const steps = useMemo(() => ([
    {
      id: "01",
      title: t('landingV2.howItWorks.steps.0.title'),
      description: t('landingV2.howItWorks.steps.0.description')
    },
    {
      id: "02",
      title: t('landingV2.howItWorks.steps.1.title'),
      description: t('landingV2.howItWorks.steps.1.description')
    },
    {
      id: "03",
      title: t('landingV2.howItWorks.steps.2.title'),
      description: t('landingV2.howItWorks.steps.2.description')
    },
    {
      id: "04",
      title: t('landingV2.howItWorks.steps.3.title'),
      description: t('landingV2.howItWorks.steps.3.description')
    }
  ]), [t]);

  return (
    <section className="bg-white py-28 md:py-40 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl text-[#0D212C] tracking-tighter"
          >
            {t('landingV2.howItWorks.titlePrefix')}{' '}
            <span className="font-serif italic text-[#0D212C]/40">{t('landingV2.howItWorks.titleEmphasis')}</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#0D212C]/40 text-sm mt-4 tracking-widest uppercase font-bold"
          >
            {t('landingV2.howItWorks.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative group pt-12"
            >
              <div className="absolute top-0 left-0 text-7xl md:text-8xl font-serif text-[#0D212C]/5 font-bold -z-10 transition-colors group-hover:text-[#0D212C]/10">
                {step.id}
              </div>
              
              <div className="liquid-glass rounded-full w-12 h-12 flex items-center justify-center mb-6 border border-black/5 bg-white/50 shadow-md">
                <span className="text-sm font-bold text-[#0D212C]">{i + 1}</span>
              </div>
              
              <h3 className="text-xl font-bold text-[#0D212C] mb-3 tracking-tight">
                {step.title}
              </h3>
              <p className="text-[#0D212C]/50 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
