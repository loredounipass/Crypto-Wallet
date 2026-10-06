import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Link } from 'react-router-dom'
import { AuthContext } from './hooks/AuthContext'
import { SocketProvider } from './hooks/SocketContext'
import useFindUser from './hooks/useFindUser'
import { fetchCsrfToken } from './api/http'

import Login from "./pages/Login"
import { Box, Container, CssBaseline, IconButton, useMediaQuery, useTheme } from './ui/material'
import { ThemeProvider } from './ui/styles';
import AdminRoute from './components/route-control/AdminRoute'
import PublicRoute from './components/route-control/PublicRoute'
import PrivateRoute from './components/route-control/PrivateRoute'
import Register from './pages/Register'
import Sidebar, { DRAWER_WIDTH_EXPANDED, DRAWER_WIDTH_COLLAPSED } from './components/Sidebar'
import Wallets from './pages/Wallets'
import Wallet from './pages/Wallet'
import SupportChat from './pages/SupportChat'
import ProviderCard from './components/providers/ProviderCard'
import CreateProvider from './pages/Create';
import Landing from './pages/Landing'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Help from './pages/Help'
import About from './pages/About'
import Contact from './pages/Contact'
import VerifyToken from './components/2FA/verify-token'
import Settings from './components/settings/Settings'
import ResendTokenForm from './components/2FA/ResendTokenForm'
import EmailVerificationComponent from './components/settings/verify'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { LanguageProvider } from './hooks/LanguageContext';
import './languages/i18n';
import Chatcomponent from './components/providers/Chat';
import ProviderDashboard from './components/providers/ProviderDashboard';
import Dashboard from './pages/Dashboard'
import P2P from './pages/P2P'
import P2POrderChat from './components/p2p/P2POrderChat'
import Swap from './pages/Swap'
import Feed from './pages/Feed'
//import Noticias from './pages/Noticias'
import BrivoAgent from './components/brivo-agent/BrivoAgent'
import { Menu as MenuIcon } from './ui/icons';
import { toggleFeedExtras } from './components/feed/FeedExtrasDrawer';
import AdminDisputes from './pages/AdminDisputes';
import AdminUsers from './pages/AdminUsers';

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/landing', '/verifytoken', '/resendtoken', '/terms', '/privacy', '/help', '/about', '/contact'];




// MAIN COMPONENT THAT MANAGES THE ROUTING, AUTHENTICATION STATE, AND APP LAYOUT
function AppContent() {



    // FETCHES THE CSRF TOKEN ON INITIAL MOUNT TO SECURE FUTURE API REQUESTS
    useEffect(() => {
        fetchCsrfToken();
    }, []);

    const { auth, setAuth, loading } = useFindUser();

    const location = useLocation();
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showNotif, setShowNotif] = useState(false);

    const isPublicRoute = publicRoutes.includes(location.pathname);
    const isAuthenticated = !!auth;




    // TOGGLES THE SIDEBAR EXPANSION STATE FOR DESKTOP VIEWS
    const handleSidebarToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };




    // CLOSES THE SIDEBAR MENU IN MOBILE VIEW
    const handleMobileClose = () => {
        setMobileOpen(false);
    };




    // OPENS THE SIDEBAR MENU IN MOBILE VIEW
    const handleMobileOpen = () => {
        setMobileOpen(true);
    };






    // DEFINES THE DYNAMIC CSS STYLES FOR THE MAIN CONTENT AREA BASED ON LAYOUT STATE
    const mainContentStyle = {
        flex: 1,
        marginLeft: (isAuthenticated && !isPublicRoute && !isMobile) ? (sidebarOpen ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED) : 0,
        transition: 'margin-left 0.3s ease-in-out',
        minHeight: '100vh',
        padding: isPublicRoute ? 0 : (isMobile && isAuthenticated ? (location.pathname.startsWith('/feed') ? '64px 0 0 0' : '80px 16px 16px 16px') : (isMobile ? '16px' : '24px')),
        width: (isAuthenticated && !isPublicRoute) ? undefined : '100%',
        minWidth: 0,
        boxSizing: 'border-box',
    };

    return (
        <AuthContext.Provider value={{ auth, setAuth, loading }}>
            <SocketProvider>
                <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0F0F1A', width: '100%', maxWidth: '100vw', overflowX: 'clip' }}>
                    <CssBaseline />

                    {isAuthenticated && !isPublicRoute && (
                        <Sidebar
                            open={isMobile ? true : sidebarOpen}
                            onToggle={handleSidebarToggle}
                            mobileOpen={mobileOpen}
                            onMobileClose={handleMobileClose}
                        />
                    )}

                    {isAuthenticated && !isPublicRoute && isMobile && (
                        <Box
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '64px',
                                zIndex: 1100,
                                backgroundColor: 'rgba(26, 26, 46, 0.85)',
                                backdropFilter: 'blur(12px)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 16px',
                                boxShadow: '0 4px 30px rgba(0,0,0,0.3)'
                            }}
                        >
                            <IconButton
                                onClick={handleMobileOpen}
                                style={{
                                    color: '#FFFFFF',
                                    position: 'absolute',
                                    left: 16,
                                }}
                            >
                                <MenuIcon />
                            </IconButton>
                            {location.pathname.startsWith('/feed') && (
                                <Box style={{
                                    position: 'absolute',
                                    left: '54%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '20px',
                                    padding: '0 8px',
                                }}>
                                    <button
                                        onClick={toggleFeedExtras}
                                        aria-label="panel del feed"
                                        title="Donaciones, links y contactos"
                                        style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" />
                                            <line x1="15" y1="3" x2="15" y2="21" />
                                        </svg>
                                    </button>
                                    <Link to="/chat" aria-label="Chat" title="Chat" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                    </Link>
                                    <Link to="/marketplace" aria-label="Marketplace" title="Marketplace" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <polyline points="9 22 9 12 15 12 15 22" />
                                        </svg>
                                    </Link>
                                    <Link to="/p2p" aria-label="Vender P2P" title="Vender P2P" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M7 7h10" />
                                            <path d="M14 4l3 3-3 3" />
                                            <path d="M10 14l-3 3 3 3" />
                                            <path d="M17 17H7" />
                                        </svg>
                                    </Link>
                                    <button
                                        onClick={() => setShowNotif((v) => !v)}
                                        aria-label="Notificaciones"
                                        title="Notificaciones"
                                        style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                        </svg>
                                        <span style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: '50%', background: '#F87171', border: '1px solid #1A1A2E' }} />
                                    </button>
                                </Box>
                            )}
                            {location.pathname === '/' && (
                                <Box style={{
                                    position: 'absolute',
                                    left: '54%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '20px',
                                    padding: '0 8px',
                                }}>
                                    <Link to="/feed" aria-label="Foro" title="Foro" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="6" height="6" x="3" y="4" rx="1" />
                                            <rect width="6" height="6" x="3" y="14" rx="1" />
                                            <path d="M13 5h8" />
                                            <path d="M13 9h5" />
                                            <path d="M13 15h8" />
                                            <path d="M13 19h5" />
                                        </svg>
                                    </Link>
                                    <Link to="/wallets" aria-label="Mis billeteras" title="Mis billeteras" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 7a2 2 0 0 1 2-2h14v4H5a2 2 0 1 0 0 4h14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                                            <circle cx="16" cy="11" r="1" />
                                        </svg>
                                    </Link>
                                    <Link to="/chat" aria-label="Chat" title="Chat" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                    </Link>
                                    <Link to="/supportChat" aria-label="Brivo Soporte" title="Brivo Soporte" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 12a8 8 0 0 1 16 0" />
                                            <rect x="3" y="12" width="4" height="6" rx="1" />
                                            <rect x="17" y="12" width="4" height="6" rx="1" />
                                            <path d="M7 18a5 5 0 0 0 10 0" />
                                        </svg>
                                    </Link>
                                    <button
                                        onClick={() => setShowNotif((v) => !v)}
                                        aria-label="Notificaciones"
                                        title="Notificaciones"
                                        style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                        </svg>
                                        <span style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: '50%', background: '#F87171', border: '1px solid #1A1A2E' }} />
                                    </button>
                                </Box>
                            )}
                            {location.pathname === '/wallets' && (
                                <Box style={{
                                    position: 'absolute',
                                    left: '54%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '20px',
                                    padding: '0 8px',
                                }}>
                                    <Link to="/" aria-label="Dashboard" title="Dashboard" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="7" height="7" rx="1" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" />
                                            <rect x="14" y="14" width="7" height="7" rx="1" />
                                        </svg>
                                    </Link>
                                    <Link to="/feed" aria-label="Foro" title="Foro" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="6" height="6" x="3" y="4" rx="1" />
                                            <rect width="6" height="6" x="3" y="14" rx="1" />
                                            <path d="M13 5h8" />
                                            <path d="M13 9h5" />
                                            <path d="M13 15h8" />
                                            <path d="M13 19h5" />
                                        </svg>
                                    </Link>
                                    <Link to="/chat" aria-label="Chat" title="Chat" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                    </Link>
                                    <Link to="/supportChat" aria-label="Brivo Soporte" title="Brivo Soporte" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 12a8 8 0 0 1 16 0" />
                                            <rect x="3" y="12" width="4" height="6" rx="1" />
                                            <rect x="17" y="12" width="4" height="6" rx="1" />
                                            <path d="M7 18a5 5 0 0 0 10 0" />
                                        </svg>
                                    </Link>
                                    <button
                                        onClick={() => setShowNotif((v) => !v)}
                                        aria-label="Notificaciones"
                                        title="Notificaciones"
                                        style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                        </svg>
                                        <span style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: '50%', background: '#F87171', border: '1px solid #1A1A2E' }} />
                                    </button>
                                </Box>
                            )}
                            {location.pathname.startsWith('/wallet/') && (
                                <Box style={{
                                    position: 'absolute',
                                    left: '54%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '20px',
                                    padding: '0 8px',
                                }}>
                                    <Link to="/p2p" aria-label="Vender P2P" title="Vender P2P" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M7 7h10" />
                                            <path d="M14 4l3 3-3 3" />
                                            <path d="M17 17H7" />
                                            <path d="M10 14l-3 3 3 3" />
                                        </svg>
                                    </Link>
                                    <Link to="/create" aria-label="Comprar P2P" title="Comprar P2P" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 10h18" />
                                            <path d="M5 10V7l2-3h10l2 3v3" />
                                            <path d="M5 10v9h14v-9" />
                                            <path d="M10 19v-5h4v5" />
                                        </svg>
                                    </Link>
                                    <Link to="/chat" aria-label="Chat" title="Chat" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                    </Link>
                                    <Link to="/swap" aria-label="Swap" title="Swap" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M16 3l4 4-4 4" />
                                            <path d="M20 7H4" />
                                            <path d="M8 21l-4-4 4-4" />
                                            <path d="M4 17h16" />
                                        </svg>
                                    </Link>
                                    <button
                                        onClick={() => setShowNotif((v) => !v)}
                                        aria-label="Notificaciones"
                                        title="Notificaciones"
                                        style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                        </svg>
                                        <span style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: '50%', background: '#F87171', border: '1px solid #1A1A2E' }} />
                                    </button>
                                </Box>
                            )}
                            {location.pathname === '/swap' && (
                                <Box style={{
                                    position: 'absolute',
                                    left: '54%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '20px',
                                    padding: '0 8px',
                                }}>
                                    <button
                                        onClick={() => setShowNotif((v) => !v)}
                                        aria-label="Notificaciones"
                                        title="Notificaciones"
                                        style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative' }}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                                        </svg>
                                        <span style={{ position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: '50%', background: '#F87171', border: '1px solid #1A1A2E' }} />
                                    </button>
                                    <Link to="/wallets" aria-label="Mis billeteras" title="Mis billeteras" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 7a2 2 0 0 1 2-2h14v4H5a2 2 0 1 0 0 4h14v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                                            <circle cx="16" cy="11" r="1" />
                                        </svg>
                                    </Link>
                                    <Link to="/" aria-label="Dashboard" title="Dashboard" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="7" height="7" rx="1" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" />
                                            <rect x="14" y="14" width="7" height="7" rx="1" />
                                        </svg>
                                    </Link>
                                    <Link to="/feed" aria-label="Foro" title="Foro" style={{ color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px', borderRadius: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="6" height="6" x="3" y="4" rx="1" />
                                            <rect width="6" height="6" x="3" y="14" rx="1" />
                                            <path d="M13 5h8" />
                                            <path d="M13 9h5" />
                                            <path d="M13 15h8" />
                                            <path d="M13 19h5" />
                                        </svg>
                                    </Link>
                                </Box>
                            )}
                            {showNotif && (location.pathname.startsWith('/feed') || location.pathname === '/' || location.pathname === '/wallets' || location.pathname.startsWith('/wallet/') || location.pathname === '/swap') && (
                                <>
                                    <div
                                        onClick={() => setShowNotif(false)}
                                        style={{ position: 'fixed', inset: 0, zIndex: 1199, background: 'transparent' }}
                                    />
                                    <div style={{
                                        position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)',
                                        zIndex: 1200, width: 'min(320px, 90vw)',
                                        background: '#12121E', border: '1px solid #2A2A3A', borderRadius: 14,
                                        boxShadow: '0 12px 40px rgba(0,0,0,0.5)', padding: '14px 16px',
                                        color: '#FFFFFF', fontSize: 14,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <strong>🔔 Notificaciones</strong>
                                            <button
                                                onClick={() => setShowNotif(false)}
                                                aria-label="Cerrar notificaciones"
                                                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#9CA3AF', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                        <div style={{ color: '#9CA3AF', fontSize: 13 }}>
                                            No tienes notificaciones nuevas.
                                        </div>
                                    </div>
                                </>
                            )}
                        </Box>
                    )}

                    {isAuthenticated && !isPublicRoute && (
                        <BrivoAgent />
                    )}

                    <Box
                        component="main"
                        style={mainContentStyle}
                    >
                        <Container maxWidth={isPublicRoute ? false : "xl"} disableGutters={isPublicRoute} sx={isPublicRoute ? { p: 0, m: 0 } : {}}>
                            <Routes>
                                <Route path='/' element={
                                    <PrivateRoute>
                                        <Dashboard />
                                    </PrivateRoute>
                                } />
                                <Route path="/wallets" element={
                                    <PrivateRoute>
                                        <Wallets />
                                    </PrivateRoute>
                                } />
                                <Route path="/wallet/:walletId" element={
                                    <PrivateRoute>
                                        <Wallet />
                                    </PrivateRoute>
                                } />
                                <Route path="/providers" element={
                                    <PrivateRoute>
                                        <ProviderCard />
                                    </PrivateRoute>
                                } />
                                <Route path="/create" element={
                                    <PrivateRoute>
                                        <CreateProvider />
                                    </PrivateRoute>
                                } />
                                <Route path='/supportChat' element={
                                    <PrivateRoute>
                                        <SupportChat />
                                    </PrivateRoute>
                                } />
                                <Route path='/settings' element={
                                    <PrivateRoute>
                                        <Settings />
                                    </PrivateRoute>
                                } />
                                <Route path='/verifyemail' element={
                                    <PrivateRoute>
                                        <EmailVerificationComponent />
                                    </PrivateRoute>
                                } />
                                <Route path='/chat' element={
                                    <PrivateRoute>
                                        <Chatcomponent />
                                    </PrivateRoute>
                                } />
                                <Route path='/provider-dashboard' element={
                                    <PrivateRoute>
                                        <ProviderDashboard />
                                    </PrivateRoute>
                                } />
                                <Route path='/p2p' element={
                                    <PrivateRoute>
                                        <P2P />
                                    </PrivateRoute>
                                } />
                                <Route path='/p2p/order/:orderId' element={
                                    <PrivateRoute>
                                        <P2POrderChat />
                                    </PrivateRoute>
                                } />
                                <Route path='/admin/disputes' element={
                                    <AdminRoute>
                                        <AdminDisputes />
                                    </AdminRoute>
                                } />
                                <Route path='/admin/users' element={
                                    <AdminRoute>
                                        <AdminUsers />
                                    </AdminRoute>
                                } />
                                <Route path='/swap' element={
                                    <PrivateRoute>
                                        <Swap />
                                    </PrivateRoute>
                                } />
                                <Route path='/feed' element={
                                    <PrivateRoute>
                                        <Feed />
                                    </PrivateRoute>
                                } />
                                <Route path='/login' element={
                                    <PublicRoute>
                                        <Login />
                                    </PublicRoute>
                                } />
                                <Route path='/register' element={
                                    <PublicRoute>
                                        <Register />
                                    </PublicRoute>
                                } />
                                <Route path='/forgot-password' element={
                                    <PublicRoute>
                                        <ForgotPassword />
                                    </PublicRoute>
                                } />
                                <Route path='/reset-password' element={
                                    <PublicRoute>
                                        <ResetPassword />
                                    </PublicRoute>
                                } />
                                <Route path='/landing' element={
                                    <PublicRoute>
                                        <Landing />
                                    </PublicRoute>
                                } />
                                <Route path='/terms' element={
                                    <PublicRoute>
                                        <Terms />
                                    </PublicRoute>
                                } />
                                <Route path='/privacy' element={
                                    <PublicRoute>
                                        <Privacy />
                                    </PublicRoute>
                                } />
                                <Route path='/help' element={
                                    <PublicRoute>
                                        <Help />
                                    </PublicRoute>
                                } />
                                <Route path='/about' element={
                                    <PublicRoute>
                                        <About />
                                    </PublicRoute>
                                } />
                                <Route path='/contact' element={
                                    <PublicRoute>
                                        <Contact />
                                    </PublicRoute>
                                } />
                                <Route path='/verifytoken' element={
                                    <PublicRoute>
                                        <VerifyToken />
                                    </PublicRoute>
                                } />
                                <Route path='/resendtoken' element={
                                    <PublicRoute>
                                        <ResendTokenForm />
                                    </PublicRoute>
                                } />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Container>
                    </Box>
                </Box>
            </SocketProvider>
        </AuthContext.Provider>
    );
}




// ROOT COMPONENT THAT WRAPS THE APP CONTENT WITH ROUTER AND CONTEXT PROVIDERS
export default function App() {
    return (
        <Router>
            <LanguageProvider>
                <ThemeProvider>
                    <AppContent />
                </ThemeProvider>
            </LanguageProvider>
        </Router>
    )
}
