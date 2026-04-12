import React, { useEffect } from 'react';
import CheckIcon from '@mui/icons-material/Check'; 
import LanguageIcon from '@mui/icons-material/Language';
import { useLanguage } from '../../hooks/LanguageContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';

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
        <div className="settings-section-wrapper">
             <div className="settings-section-header">
                 <div className="settings-large-icon">
                     <LanguageIcon className="settings-large-icon-inner" />
                 </div>
                 <h2 className="settings-title">
                     {t('language_selection')}
                 </h2>
             </div>

            <div className="settings-language-list">
                {Object.entries(languageOptions).map(([key, value]) => {
                    const isSelected = language === key;
                    return (
                        <button
                            key={key}
                            onClick={() => handleSelect(key)}
                            className={`settings-language-btn ${isSelected ? 'active' : ''}`}
                        >
                            <span className="sidebar-text" style={{ fontSize: '1.125rem' }}>{value}</span>
                            {isSelected && (
                                <div className="settings-check-circle">
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
