import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Mail, Globe, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('student');

  const footerSections = useMemo(() => ([
    {
      title: t('landingV2.footer.sections.academic.title'),
      links: [
        t('landingV2.footer.sections.academic.links.0'),
        t('landingV2.footer.sections.academic.links.1'),
        t('landingV2.footer.sections.academic.links.2'),
        t('landingV2.footer.sections.academic.links.3')
      ]
    },
    {
      title: t('landingV2.footer.sections.predict.title'),
      links: [
        t('landingV2.footer.sections.predict.links.0'),
        t('landingV2.footer.sections.predict.links.1'),
        t('landingV2.footer.sections.predict.links.2'),
        t('landingV2.footer.sections.predict.links.3')
      ]
    },
    {
      title: t('landingV2.footer.sections.company.title'),
      links: [
        t('landingV2.footer.sections.company.links.0'),
        t('landingV2.footer.sections.company.links.1'),
        t('landingV2.footer.sections.company.links.2'),
        t('landingV2.footer.sections.company.links.3')
      ]
    }
  ]), [t]);

  return (
    <footer className="bg-white pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="liquid-glass rounded-[40px] px-8 py-16 md:p-20 bg-slate-50 overflow-hidden relative border border-black/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#0D212C]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="max-w-xl">
              <h2 className="text-5xl md:text-7xl font-serif tracking-tighter text-[#0D212C] mb-8">
                {t('landingV2.footer.titlePrefix')}{' '}
                <em className="font-serif-italic italic">{t('landingV2.footer.titleEmphasis')}</em>{' '}
                {t('landingV2.footer.titleSuffix')}
              </h2>
              
              <button className="liquid-glass-dark rounded-full px-10 py-4 text-white font-medium flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl">
                {t('landingV2.footer.cta')}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:gap-24">
              {footerSections.map((section) => (
                <div key={section.title} className="space-y-4">
                  <span className="text-[#0D212C]/40 text-xs tracking-widest uppercase font-bold">{section.title}</span>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link}><a href="#" className="text-sm font-semibold text-[#0D212C] hover:text-[#0D212C]/60">{link}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-20 pt-8 border-t border-black/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#0D212C]" />
              <span className="text-[#0D212C] font-bold text-xl">{t('landingV2.footer.brand')}</span>
            </div>
            
            <p className="text-xs text-[#0D212C]/40 font-bold uppercase tracking-widest">
              {t('landingV2.footer.copyright')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
