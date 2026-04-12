import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChangePasswordComponent from './ChangePasswordComponent';
import TwoFactorAuthComponent from './TwoFactorAuthComponent';
import LanguageSelectorComponent from './LanguageSelectorComponent';
import UserProfileComponent from './UserProfileComponent'; 
import VerifyEmailComponent from './VerifyEmailComponent'; 
import { 
    Box, 
    Paper, 
    List, 
    ListItem, 
    ListItemIcon, 
    ListItemText, 
    Typography, 
    Divider,
} from '../../ui/material';
import { Lock as LockIcon } from '../../ui/icons';
import { Security as SecurityIcon } from '../../ui/icons';
import { Language as LanguageIcon } from '../../ui/icons';
import { Person as PersonIcon } from '../../ui/icons';
import { ArrowBack as ArrowBackIcon } from '../../ui/icons'; 
import { Settings as SettingsIcon } from '../../ui/icons'; 
import { Link } from 'react-router-dom';
import { useThemeMode } from '../../ui/styles';

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
    const { mode } = useThemeMode();
    const isDark = mode === 'dark';

    const containerStyle = {
        marginTop: "32px",
        display: "flex",
        minHeight: "80vh",
        width: "100%",
    };

    const paperStyle = {
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
        width: "100%",
        backgroundColor: isDark ? "#1A1A2E" : "#FFFFFF",
        border: `1px solid ${isDark ? "#2D2D44" : "#E5E7EB"}`,
    };

    const sidebarStyle = {
        width: "240px",
        backgroundColor: isDark ? "#0F0F1A" : "#F3F4F6",
        padding: "16px 0",
        flexShrink: 0,
    };

    const listItemStyle = (isSelected) => ({
        padding: "12px 16px",
        cursor: "pointer",
        backgroundColor: isSelected ? (isDark ? "#2186EB" : "#2186EB") : "transparent",
        color: isSelected ? "white" : (isDark ? "#FFFFFF" : "#1A1A2E"),
        display: "flex",
        alignItems: "center",
        transition: "background-color 0.2s",
        borderRadius: "8px",
        margin: "4px 8px",
    });

    const contentStyle = {
        flex: 1,
        padding: "24px",
    };

    const dividerStyle = {
        marginBottom: "16px",
        borderColor: isDark ? "#2D2D44" : "#E5E7EB",
    };

    return (
        <Box style={containerStyle}>
            <Paper style={paperStyle}>
                <Box style={sidebarStyle}>
                    <List style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {sections.map(({ id, label, icon }) => (
                            <ListItem
                                key={id}
                                onClick={() => setSelectedSection(id)}
                                style={listItemStyle(selectedSection === id)}
                                onMouseOver={(e) => {
                                    if (selectedSection !== id) {
                                        e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (selectedSection !== id) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }
                                }}
                            >
                                <ListItemIcon style={{ color: selectedSection === id ? "white" : (isDark ? "#9CA3AF" : "#6B7280"), minWidth: "40px", fontSize: 24 }}>
                                    {icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={t(label)} 
                                    style={{ fontSize: "14px", fontWeight: 500, color: selectedSection === id ? "white" : "inherit" }}
                                />
                            </ListItem>
                        ))}
                        <ListItem
                            component={Link}
                            to="/"
                            style={{
                                marginTop: "auto",
                                padding: "12px 16px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                color: isDark ? "#9CA3AF" : "#6B7280",
                                borderRadius: "8px",
                                margin: "4px 8px",
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                        >
                            <ListItemIcon style={{ color: "inherit", minWidth: "40px", fontSize: 24 }}>
                                <ArrowBackIcon />
                            </ListItemIcon>
                            <ListItemText
                                primary={t('go_back')} 
                                style={{ fontSize: "14px", fontWeight: 500 }}
                            />
                        </ListItem>
                    </List>
                </Box>
                <Box style={contentStyle}>
                    <Box style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                        <SettingsIcon style={{ fontSize: 32, marginRight: "8px", color: isDark ? "#FFFFFF" : "#1A1A2E" }} />
                        <Typography 
                            variant="h4" 
                            component="h1" 
                            style={{ color: isDark ? "#FFFFFF" : "#1A1A2E", fontSize: "24px", fontWeight: 600 }}
                        >
                            {t('settings_title')} 
                        </Typography>
                    </Box>
                    <Divider style={dividerStyle} />
                    {renderSection(selectedSection)}
                </Box>
            </Paper>
        </Box>
    );
}

export default Settings;