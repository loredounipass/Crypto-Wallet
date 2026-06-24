import React, { createContext, use, useState, useEffect } from 'react';
import i18n from '../i18n'; 

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'es';
    }); 

    useEffect(() => {
        i18n.changeLanguage(language); 
    }, [language]);

    const handleLanguageChange = (lng) => {
        setLanguage(lng);
        i18n.changeLanguage(lng);
        localStorage.setItem('language', lng); 
    };

    return (
        <LanguageContext.Provider value={{ language, handleLanguageChange }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => use(LanguageContext);
