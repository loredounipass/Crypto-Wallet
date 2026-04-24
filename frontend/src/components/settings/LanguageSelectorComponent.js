import React, { useEffect } from 'react';
import { Check as CheckIcon, Language as LanguageIcon } from '../../ui/icons';
import { useLanguage } from '../../hooks/LanguageContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

import './Settings.css';


function LanguageSelectorComponent() {
    const { language, handleLanguageChange } = useLanguage();
    const { t } = useTranslation();
    
    

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
             <div className="mb-6 flex items-center gap-4 border-b pb-4" style={{ borderColor: 'var(--settings-border)' }}>
                 <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
                     <LanguageIcon className="text-[28px]" style={{ color: 'var(--settings-primary)' }} />
                 </div>
                 <h2 className="m-0 text-[20px] font-semibold" style={{ color: 'var(--settings-text)' }}>
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
                            className={`flex w-full cursor-pointer items-center justify-between rounded-xl border px-5 py-4 font-medium transition-all ${isSelected ? 'bg-[rgba(33,134,235,0.05)]' : ''}`}
                            style={{ 
                              borderColor: isSelected ? 'var(--settings-primary)' : 'var(--settings-border)', 
                              backgroundColor: isSelected ? 'rgba(33,134,235,0.05)' : 'var(--settings-card)', 
                              color: 'var(--settings-text)'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.borderColor = 'var(--settings-primary)';
                              e.target.style.backgroundColor = 'var(--settings-bg)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.borderColor = isSelected ? 'var(--settings-primary)' : 'var(--settings-border)';
                              e.target.style.backgroundColor = isSelected ? 'rgba(33,134,235,0.05)' : 'var(--settings-card)';
                            }}
                        >
                            <span className="text-lg">{value}</span>
                            {isSelected && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--settings-primary)' }}>
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
