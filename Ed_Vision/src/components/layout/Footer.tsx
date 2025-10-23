import { useTranslation } from 'react-i18next'

type Props = {
  // Add props if needed for customization
  className?: string
}

export default function Footer({ className = "" }: Props) {
  const { t } = useTranslation(['common'])
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className={`py-12 text-white bg-slate-800 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-6 mb-6">
          {/* Logo & Slogan */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-3">
              <img src="/src/assets/shared/logo_predica.jpg" alt="Predica Logo" className="h-12 w-auto object-contain rounded-xl" />
            </div>
            <p className="text-gray-300 text-xs">{t('common:footer.slogan')}</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-bold text-base mb-3">{t('common:footer.sections.product.title')}</h4>
            <ul className="space-y-1 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.product.features')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.product.pricing')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.product.api')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.product.integrations')}</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-base mb-3">{t('common:footer.sections.company.title')}</h4>
            <ul className="space-y-1 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.company.aboutUs')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.company.careers')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.company.blog')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.company.press')}</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold text-base mb-3">{t('common:footer.sections.support.title')}</h4>
            <ul className="space-y-1 text-gray-300">
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.support.helpCenter')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.support.contactUs')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.support.privacyPolicy')}</a></li>
              <li><a href="#" className="hover:text-white transition-colors text-sm">{t('common:footer.sections.support.termsOfService')}</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold text-base mb-3">{t('common:footer.sections.social.title')}</h4>
            <div className="flex space-x-3">
              <a href="#" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-purple-500 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-white/20">
          <p className="text-center text-gray-300 text-sm">{t('common:footer.copyright', { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  )
}