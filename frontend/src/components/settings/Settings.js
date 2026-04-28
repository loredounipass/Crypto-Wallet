import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChangePasswordComponent from './ChangePasswordComponent';
import TwoFactorAuthComponent from './TwoFactorAuthComponent';
import LanguageSelectorComponent from './LanguageSelectorComponent';
import UserProfileComponent from './UserProfileComponent'; 
import VerifyEmailComponent from './VerifyEmailComponent'; 
import {
    Lock as LockIcon,
    Security as SecurityIcon,
    Language as LanguageIcon,
    Person as PersonIcon,
    ArrowBack as ArrowBackIcon,
    Settings as SettingsIcon,
} from '../../ui/icons';
import { Link } from 'react-router-dom';
import { useTheme, useMediaQuery } from '../../ui/material';

import './Settings.css';

const sections = [
    { id: 'userProfile', label: 'user_profile', icon: <PersonIcon /> },
    { id: 'changePassword', label: 'change_password', icon: <LockIcon /> },
    { id: 'twoFactorAuth', label: 'two_factor_auth', icon: <SecurityIcon /> },
    { id: 'languageSelector', label: 'language_selector', icon: <LanguageIcon /> },
    { id: 'verifyEmail', label: 'verify_email', icon: <SecurityIcon /> },
];

const renderSection = (selectedSection) => {
    switch (selectedSection) {
        case 'userProfile': return <UserProfileComponent />;
        case 'changePassword': return <ChangePasswordComponent />;
        case 'twoFactorAuth': return <TwoFactorAuthComponent />;
        case 'languageSelector': return <LanguageSelectorComponent />;
        case 'verifyEmail': return <VerifyEmailComponent />;
        default: return null;
    }
};

function Settings() {
    const { t } = useTranslation(); 
    const [selectedSection, setSelectedSection] = useState('userProfile');

    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
    const isTablet = useMediaQuery(muiTheme.breakpoints.down("md"));

    return (
        <div
            className={`min-h-screen ${isMobile ? 'p-0 py-2' : isTablet ? 'p-6' : 'p-10'} settings-bg`}
        >
            <div
                className={`mx-auto flex w-full max-w-[1100px] overflow-hidden rounded-2xl border ${isMobile ? 'flex-col min-h-[82vh]' : 'flex-row min-h-[75vh]'} settings-border settings-card`}
            >
                {/* Sidebar */}
                <div
                    role="navigation"
                    aria-label="Settings navigation"
                    className={`flex gap-2 ${isMobile ? 'w-full flex-row overflow-x-auto border-b p-3 hide-scrollbar' : 'min-w-[280px] flex-col border-r px-6 py-8'} settings-border settings-sidebar`}
                >
                    <ul className={`m-0 flex w-full list-none gap-2 p-0 ${isMobile ? 'flex-row' : 'flex-col'}`}>
                        {sections.map(({ id, label, icon }) => (
                            <li key={id}>
                                <button
                                    onClick={() => setSelectedSection(id)}
                                    className={`w-full cursor-pointer rounded-xl border px-[18px] ${isMobile ? 'py-[10px] whitespace-nowrap' : 'py-[14px]'} text-left text-[15px] transition-all duration-200 flex items-center gap-3 ${selectedSection === id ? `font-semibold text-[#2186EB] bg-[rgba(45,45,68,0.5)] border-transparent` : `font-medium text-[var(--settings-muted)] border-transparent bg-transparent`}`}
                                >
                                    <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
                                    {!isMobile && <span>{t(label)}</span>}
                                </button>
                            </li>
                        ))}
                        
                        <li className={isMobile ? '' : 'mt-auto pt-4'}>
                            <Link
                                to="/"
                                className={`w-full cursor-pointer rounded-xl border px-[18px] ${isMobile ? 'py-[10px] whitespace-nowrap' : 'py-[14px]'} text-left text-[15px] transition-all duration-200 flex items-center gap-3 font-medium no-underline border-transparent bg-transparent text-[var(--settings-muted)]`}
                            >
                                <span style={{ display: 'flex', alignItems: 'center' }}><ArrowBackIcon /></span>
                                {!isMobile && <span>{t('go_back')}</span>}
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Main Content */}
                <div className={`flex-1 flex flex-col overflow-y-auto ${isMobile ? 'px-3 py-5' : 'p-10'}`}>
                    <div className="mb-6 flex items-center gap-3 border-b pb-4 settings-border">
                        <SettingsIcon style={{ color: 'var(--settings-primary)', fontSize: '32px' }} />
                        <h1 className={`m-0 font-bold ${isMobile ? 'text-[22px]' : 'text-[28px]'}`} style={{ color: 'var(--settings-text)' }}>
                            {t('settings_title')}
                        </h1>
                    </div>
                    
                    <div className="w-full">
                        {renderSection(selectedSection)}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;
