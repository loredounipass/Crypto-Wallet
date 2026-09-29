import { useEffect, useState } from 'react';
import { useLanguage } from '../../hooks/LanguageContext';
import { useTranslation } from 'react-i18next';
import LanguagesService from '../../services/languages';



// DEFAULT LANGUAGES FALLBACK
const defaultLanguages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];



// CUSTOM HOOK THAT MANAGES THE FETCHING AND SELECTION OF AVAILABLE LANGUAGES
export default function useLanguageSelectorLogic() {
    const { language, handleLanguageChange } = useLanguage();
    const { t } = useTranslation();
    const [toast, setToast] = useState(null);
    const [languageOptions, setLanguageOptions] = useState([]);



    // EFFECT TO FETCH AVAILABLE LANGUAGES FROM THE API OR LOAD DEFAULTS
    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const res = await LanguagesService.getAllLanguages();
                const apiLangs = (res?.data && Array.isArray(res.data)) ? res.data : [];
                const langMap = new Map();
                for (const lang of apiLangs) {
                    langMap.set(lang.code, lang);
                }
                for (const lang of defaultLanguages) {
                    if (!langMap.has(lang.code)) {
                        langMap.set(lang.code, { ...lang, active: language === lang.code });
                    }
                }
                setLanguageOptions(Array.from(langMap.values()));
            } catch {
                setLanguageOptions(
                    defaultLanguages.map(lang => ({ ...lang, active: language === lang.code }))
                );
            }
        };
        fetchLanguages();
    }, [language]);



    // HANDLES TOGGLING BETWEEN THE SELECTED LANGUAGE AND A NEW ONE
    const handleToggle = (langKey) => {
        const newLang = langKey === language
            ? languageOptions.find(l => l.code !== langKey)?.code || 'es'
            : langKey;
        handleLanguageChange(newLang);
        setToast({ kind: 'success', message: t('language_changed', 'Idioma cambiado exitosamente') });
    };

    return {
        t,
        toast,
        setToast,
        language,
        languageOptions,
        handleToggle
    };
}
