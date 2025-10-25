import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

type Language = {
  code: string;
  name: string;
  flagUrl: string;
};

const languages: Language[] = [
  { 
    code: 'en', 
    name: 'ENGLISH', 
    flagUrl: 'https://flagcdn.com/w40/gb.png'
  },
  { 
    code: 'vi', 
    name: 'TIẾNG VIỆT', 
    flagUrl: 'https://flagcdn.com/w40/vn.png'
  },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-purple-400 transition-all duration-200 hover:shadow-sm"
      >
        <img 
          src={currentLanguage.flagUrl} 
          alt={currentLanguage.name}
          className="w-5 h-4 object-cover rounded-sm"
        />
        <svg 
          className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-top-2 duration-200">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                currentLanguage.code === language.code ? 'bg-purple-50' : ''
              }`}
            >
              <img 
                src={language.flagUrl} 
                alt={language.name}
                className="w-6 h-4 object-cover rounded-sm"
              />
              <span className={`text-sm font-semibold ${
                currentLanguage.code === language.code ? 'text-purple-600' : 'text-gray-700'
              }`}>
                {language.name}
              </span>
              {currentLanguage.code === language.code && (
                <svg className="w-4 h-4 text-green-500 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
