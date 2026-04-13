import React, { useEffect } from 'react';
import { Check as CheckIcon, Language as LanguageIcon } from '../../ui/icons';
import { useLanguage } from '../../hooks/LanguageContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { useThemeMode } from '../../ui/styles';

function LanguageSelectorComponent() {
    const { language, handleLanguageChange } = useLanguage();
    const { t } = useTranslation();
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';

    const languageOptions = {
        es: 'Español',
        en: 'English',
    };

    useEffect(() => {
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) {
            handleLanguageChange(savedLanguage);
            i18n.changeLanguage(savedLanguage);
        }
    }, [handleLanguageChange]);

    const handleSelect = (langKey) => {
        handleLanguageChange(langKey);
        i18n.changeLanguage(langKey);
        localStorage.setItem('language', langKey);
    };

    return (
        <div className="w-full">
             <div className={`mb-6 flex items-center gap-4 border-b pb-4 ${isDark ? 'border-[#2D2D44]' : 'border-[#E5E7EB]'}`}>
                 <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
                     <LanguageIcon className="text-[28px] text-[#2186EB]" />
                 </div>
                 <h2 className={`m-0 text-[20px] font-semibold ${isDark ? 'text-white' : 'text-[#111827]'}`}>
                     {t('language_selection')}
                 </h2>
             </div>

            <div className="flex flex-col gap-3">
                {Object.entries(languageOptions).map(([key, value]) => {
                    const isSelected = language === key;
                    return (
                        <button
                            key={key}
                            onClick={() => handleSelect(key)}
                            className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-5 py-4 font-medium transition-all ${isSelected ? 'border-[#2186EB] bg-[rgba(33,134,235,0.05)]' : ''} ${isDark ? 'border-[#2D2D44] bg-[#1A1A2E] text-white hover:border-[#2186EB] hover:bg-[#0F0F1A]' : 'border-[#E5E7EB] bg-white text-[#111827] hover:border-[#2186EB] hover:bg-[#F6F8FA]'}`}
                        >
                            <span className="text-lg">{value}</span>
                            {isSelected && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2186EB]">
                                    <CheckIcon style={{ color: 'white', fontSize: '0.875rem' }} />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default LanguageSelectorComponent;
