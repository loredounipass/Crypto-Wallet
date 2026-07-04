import React, { useEffect, useState } from 'react';
import { Language as LanguageIcon } from '../../ui/icons';
import { useLanguage } from '../../hooks/LanguageContext';
import { useTranslation } from 'react-i18next';
import TransactionToast from '../TransactionToast';
import LanguagesService from '../../services/languages';

import './Settings.css';

const Switch = ({ checked, onChange, disabled }) => (
    <button
        onClick={disabled ? null : onChange}
        className={`relative h-6 w-12 rounded-xl border-0 p-[2px] transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        style={{ backgroundColor: checked ? 'var(--settings-primary)' : 'var(--settings-border)' }}
        role="switch"
        aria-checked={checked}
    >
        <span
            className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}
        />
    </button>
);

const defaultLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];

function LanguageSelectorComponent() {
    const { language, handleLanguageChange } = useLanguage();
    const { t } = useTranslation();
    const [toast, setToast] = useState(null);
    const [languageOptions, setLanguageOptions] = useState([]);

    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const res = await LanguagesService.getAllLanguages();
                const apiLangs = (res?.data && Array.isArray(res.data)) ? res.data : [];
                const existingCodes = new Set(apiLangs.map(l => l.code));
                const merged = [...apiLangs];
                for (const lang of defaultLanguages) {
                    if (!existingCodes.has(lang.code)) {
                        merged.push({ ...lang, active: language === lang.code });
                    }
                }
                setLanguageOptions(merged);
            } catch {
                setLanguageOptions(
                    defaultLanguages.map(lang => ({ ...lang, active: language === lang.code }))
                );
            }
        };
        fetchLanguages();
    }, [language]);

    const handleToggle = (langKey) => {
        const newLang = langKey === language
            ? languageOptions.find(l => l.code !== langKey)?.code || 'es'
            : langKey;
        handleLanguageChange(newLang);
        setToast({ kind: 'success', message: t('language_changed', 'Idioma cambiado exitosamente') });
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
                {languageOptions.map((lang) => {
                    const isSelected = language === lang.code;
                    return (
                        <div
                            key={lang.code}
                            className="flex w-full items-center justify-between rounded-xl border px-5 py-4 transition-all"
                            style={{
                                borderColor: isSelected ? 'var(--settings-primary)' : 'var(--settings-border)',
                                backgroundColor: isSelected ? 'rgba(33,134,235,0.05)' : 'var(--settings-card)',
                                color: 'var(--settings-text)'
                            }}
                        >
                            <span className="text-lg">{lang.nativeName || lang.name}</span>
                            <Switch
                                checked={isSelected}
                                onChange={() => handleToggle(lang.code)}
                            />
                        </div>
                    );
                })}
            </div>
            <TransactionToast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}

export default LanguageSelectorComponent;
