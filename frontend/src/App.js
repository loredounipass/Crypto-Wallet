import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthContext } from './hooks/AuthContext'
import { SocketProvider } from './hooks/SocketContext'
import useFindUser from './hooks/useFindUser'
import { fetchCsrfToken } from './api/http'

import Login from "./pages/Login"
import { Box, Container, CssBaseline, IconButton, useMediaQuery, useTheme } from './ui/material'
import { ThemeProvider } from './ui/styles';
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
import BrivoAgent from './components/BrivoAgent'
import { Menu as MenuIcon } from './ui/icons';

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/landing', '/verifytoken', '/resendtoken'];

function AppContent() {
    useEffect(() => {
        fetchCsrfToken();
    }, []);

    const { auth, setAuth, loading } = useFindUser();

    const location = useLocation();
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const isPublicRoute = publicRoutes.includes(location.pathname);
    const isAuthenticated = !!auth;

    const handleSidebarToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleMobileClose = () => {
        setMobileOpen(false);
    };

    const handleMobileOpen = () => {
        setMobileOpen(true);
    };



    const mainContentStyle = {
        flex: 1,
        marginLeft: (isAuthenticated && !isPublicRoute && !isMobile) ? (sidebarOpen ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED) : 0,
        transition: 'margin-left 0.3s ease-in-out',
        minHeight: '100vh',
        padding: isPublicRoute ? 0 : (isMobile && isAuthenticated ? '80px 16px 16px 16px' : (isMobile ? '16px' : '24px')),
        width: (isAuthenticated && !isPublicRoute) ? undefined : '100%',
        minWidth: 0,
        boxSizing: 'border-box',
    };

    return (
        <AuthContext.Provider value={{ auth, setAuth, loading }}>
            <SocketProvider>
                <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0F0F1A', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
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
                                    marginRight: '12px'
                                }}
                            >
                                <MenuIcon />
                            </IconButton>
                        </Box>
                    )}

                    {isAuthenticated && !isPublicRoute && (
                        <BrivoAgent />
                    )}

                    <Box
                        component="main"
                        style={mainContentStyle}
                    >
                        <Container maxWidth="xl" sx={{ p: 0 }}>
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
