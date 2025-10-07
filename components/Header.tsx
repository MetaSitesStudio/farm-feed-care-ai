
import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';

export const Header: React.FC = () => {
  const { setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <header className="mb-6 pb-4 border-b-2 border-red-600 relative">
      <h1 className="text-4xl font-bold text-gray-800">
        {t('header.title.part1')} <span className="text-red-600">{t('header.title.part2')}</span>
      </h1>
      <p className="text-lg text-gray-600 mt-1">
        {t('header.subtitle')}
      </p>
      <div className="absolute top-0 right-0">
        <select 
          onChange={(e) => setLanguage(e.target.value as 'en' | 'tl' | 'ceb')}
          className="p-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition bg-gray-700 text-white border-gray-600"
          aria-label={t('header.languageSelectorLabel')}
        >
          <option value="en">English</option>
          <option value="tl">Tagalog</option>
          <option value="ceb">Visayan</option>
        </select>
      </div>
    </header>
  );
};
