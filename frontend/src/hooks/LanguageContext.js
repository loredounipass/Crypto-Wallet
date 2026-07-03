import React, { createContext, use, useState, useEffect, useCallback, useRef } from 'react';
import i18n from '../languages/i18n';
import LanguagesService from '../services/languages';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'es';
    });
    const [isLoading, setIsLoading] = useState(true);
    const initialLoadDone = useRef(false);

    useEffect(() => {
        const fetchUserLang = async () => {
            try {
                const res = await LanguagesService.getUserLanguage();
                if (res && res.data && res.data.language) {
                    const serverLang = res.data.language;
                    localStorage.setItem('language', serverLang);
                    setLanguage(serverLang);
                }
            } catch {
                // User not authenticated or endpoint unavailable, keep localStorage value
            }
        };
        fetchUserLang();
    }, []);

    useEffect(() => {
        const loadLanguage = async (lng) => {
            if (!initialLoadDone.current) {
                setIsLoading(true);
            }
            try {
                const res = await LanguagesService.getLanguage(lng);
                if (res && res.data && res.data.data) {
                    i18n.addResourceBundle(lng, 'translation', res.data.data, true, true);
                    i18n.changeLanguage(lng);
                }
            } catch (error) {
                console.error("Error loading language", error);
            } finally {
                initialLoadDone.current = true;
                setIsLoading(false);
            }
        };
        loadLanguage(language);
    }, [language]);

    const handleLanguageChange = useCallback((lng) => {
        setLanguage(lng);
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
        LanguagesService.updateUserLanguage(lng).catch(() => {
            // silently fail if user is not authenticated
        });
    }, []);

    return (
        <LanguageContext.Provider value={{ language, handleLanguageChange, isLoading }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => use(LanguageContext);
