import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, useMediaQuery } from '../../ui/material';
import {
    Lock as LockIcon,
    Security as SecurityIcon,
    Language as LanguageIcon,
    Person as PersonIcon
} from '../../ui/icons';



// CUSTOM HOOK THAT MANAGES THE STATE AND RESPONSIVENESS OF THE SETTINGS PAGE
export default function useSettingsLogic() {
    const { t } = useTranslation(); 
    const [selectedSection, setSelectedSection] = useState('userProfile');

    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(muiTheme.breakpoints.down("md"));

    const sections = [
        { id: 'userProfile', label: 'user_profile', icon: <PersonIcon /> },
        { id: 'changePassword', label: 'change_password', icon: <LockIcon /> },
        { id: 'twoFactorAuth', label: 'two_factor_auth', icon: <SecurityIcon /> },
        { id: 'languageSelector', label: 'language_selector', icon: <LanguageIcon /> },
        { id: 'verifyEmail', label: 'verify_email', icon: <SecurityIcon /> },
    ];

    return {
        t,
        selectedSection,
        setSelectedSection,
        isMobile,
        isTablet,
        sections
    };
}
