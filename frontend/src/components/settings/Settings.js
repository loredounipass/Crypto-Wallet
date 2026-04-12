import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChangePasswordComponent from './ChangePasswordComponent';
import TwoFactorAuthComponent from './TwoFactorAuthComponent';
import LanguageSelectorComponent from './LanguageSelectorComponent';
import UserProfileComponent from './UserProfileComponent'; 
import VerifyEmailComponent from './VerifyEmailComponent'; 
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import PersonIcon from '@mui/icons-material/Person';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import SettingsIcon from '@mui/icons-material/Settings'; 
import { Link } from 'react-router-dom';
import { Box, Typography, useTheme, useMediaQuery } from '../../ui/material';
import { useThemeMode } from '../../ui/styles';
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
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';

    const styles = {
        pageContainer: {
            padding: isMobile ? "16px" : isTablet ? "24px" : "40px",
            minHeight: "100vh",
            backgroundColor: isDark ? "#0F0F1A" : "#F6F8FA",
        },
        container: {
            maxWidth: "1100px",
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
            borderRadius: "16px",
            border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            boxShadow: isDark ? "none" : "0 4px 20px rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
            minHeight: "75vh",
        },
        sidebar: {
            backgroundColor: isDark ? "#12121D" : "#F8FAFC",
            minWidth: isMobile ? "100%" : "280px",
            padding: isMobile ? "16px" : "32px 24px",
            borderRight: isMobile ? "none" : `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
            borderBottom: isMobile ? `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}` : "none",
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            overflowX: isMobile ? "auto" : "visible",
            gap: "8px",
        },
        sidebarList: {
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            gap: "8px",
            width: "100%",
        },
        sidebarBtn: (isActive) => ({
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: isMobile ? "10px 14px" : "14px 18px",
            borderRadius: "12px",
            backgroundColor: isActive ? (isDark ? "#2D2D44" : "#FFFFFF") : "transparent",
            color: isActive ? "#2186EB" : (isDark ? "#9CA3AF" : "#6B7280"),
            border: isActive && !isDark ? "1px solid #E5E7EB" : "1px solid transparent",
            boxShadow: isActive && !isDark ? "0 2px 4px rgba(0,0,0,0.02)" : "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontWeight: isActive ? 600 : 500,
            fontSize: "15px",
            textAlign: "left",
            textDecoration: "none",
            whiteSpace: isMobile ? "nowrap" : "normal",
        }),
        mainContent: {
            padding: isMobile ? "24px 16px" : "40px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
        },
        header: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "32px",
            paddingBottom: "20px",
            borderBottom: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
        },
        title: {
            color: isDark ? "#FFFFFF" : "#111827",
            fontSize: isMobile ? "22px" : "28px",
            fontWeight: 700,
            margin: 0,
        },
        icon: {
            color: "#2186EB",
            fontSize: "32px",
        }
    };

    return (
        <Box sx={styles.pageContainer}>
            <Box sx={styles.container}>
                {/* Sidebar */}
            <Box sx={styles.sidebar} role="navigation" aria-label="Settings navigation">
                <ul style={styles.sidebarList}>
                    {sections.map(({ id, label, icon }) => (
                        <li key={id}>
                            <button
                                onClick={() => setSelectedSection(id)}
                                style={styles.sidebarBtn(selectedSection === id)}
                            >
                                <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
                                {!isMobile && <span>{t(label)}</span>}
                            </button>
                        </li>
                    ))}
                    
                    <li style={{ marginTop: isMobile ? "0" : "auto", paddingTop: isMobile ? "0" : "16px" }}>
                        <Link
                            to="/"
                            style={styles.sidebarBtn(false)}
                        >
                            <span style={{ display: 'flex', alignItems: 'center' }}><ArrowBackIcon /></span>
                            {!isMobile && <span>{t('go_back')}</span>}
                        </Link>
                    </li>
                </ul>
            </Box>

            {/* Main Content */}
            <Box sx={styles.mainContent}>
                <Box sx={styles.header}>
                    <SettingsIcon style={styles.icon} />
                    <h1 style={styles.title}>
                        {t('settings_title')}
                    </h1>
                </Box>
                
                <Box sx={{ flex: 1 }}>
                    {renderSection(selectedSection)}
                </Box>
            </Box>
        </Box>
        </Box>
    );
}

export default Settings;
