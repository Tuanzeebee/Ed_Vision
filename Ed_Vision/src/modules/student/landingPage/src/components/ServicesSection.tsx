import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function ServicesSection() {
  const { t } = useTranslation('student');
  const navigate = useNavigate();

  const services = useMemo(() => ([
    {
      id: 'forecast',
      tag: t('landingV2.services.items.0.tag'),
      title: t('landingV2.services.items.0.title'),
      description: t('landingV2.services.items.0.description'),
      video: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4",
      href: '/student/upload-transcript'
    },
    {
      id: 'certificates',
      tag: t('landingV2.services.items.1.tag'),
      title: t('landingV2.services.items.1.title'),
      description: t('landingV2.services.items.1.description'),
      video: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260324_151826_c7218672-6e92-402c-9e45-f1e0f454bdc4.mp4",
      href: '/student/certificate-review'
    },
    {
      id: 'learning-space',
      tag: t('landingV2.services.items.2.tag'),
      title: t('landingV2.services.items.2.title'),
      description: t('landingV2.services.items.2.description'),
      video: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260402_054547_9875cfc5-155a-4229-8ec8-b7ba7125cbf8.mp4",
      href: '/student/learning-space'
    }
  ]), [t]);

  return (
    <section className="bg-white py-28 md:py-40 px-6 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.02)_0%,_transparent_60%)] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-16"
        >
          <h2 className="text-3xl md:text-5xl text-[#0D212C] tracking-tighter">{t('landingV2.services.title')}</h2>
          <span className="hidden md:block text-[#0D212C]/40 text-sm font-medium">{t('landingV2.services.subtitle')}</span>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => {
            const isLearningSpace = service.id === 'learning-space';
            const videoScaleClass = isLearningSpace ? 'scale-105 group-hover:scale-110' : 'group-hover:scale-105';

            return (
            <motion.button
              key={service.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.15 }}
              type="button"
              onClick={() => navigate(service.href)}
              className="liquid-glass rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-500 bg-white/20 border border-black/5 text-left w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D212C]/40"
            >
              <div className="aspect-video relative overflow-hidden">
                <video
                  className={`w-full h-full object-cover transition-transform duration-700 ${videoScaleClass}`}
                  src={service.video}
                  muted
                  autoPlay
                  loop
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>

              <div className="p-7 md:p-8">
                <div className="flex items-center justify-between mb-5">
                  <span className="uppercase tracking-[0.18em] text-[#0D212C]/40 text-[10px] font-bold">
                    {service.tag}
                  </span>
                  <div className="liquid-glass rounded-full p-2.5 bg-white/50 group-hover:bg-[#0D212C] group-hover:text-white transition-colors duration-300">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                
                <h3 className="text-[#0D212C] text-2xl md:text-3xl font-medium mb-2.5 tracking-tight">
                  {service.title}
                </h3>
                <p className="text-[#0D212C]/60 text-sm md:text-base leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
