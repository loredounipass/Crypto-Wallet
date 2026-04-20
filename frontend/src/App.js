import React, { useState } from 'react'
import { BrowserRouter as Router, Switch, useLocation } from 'react-router-dom'
import { AuthContext } from './hooks/AuthContext'
import { SocketProvider } from './hooks/SocketContext'
import useFindUser from './hooks/useFindUser'

import Login from "./pages/Login"
import { Box, Container, CssBaseline, IconButton, useMediaQuery, useTheme } from './ui/material'
import { ThemeProvider, useThemeMode } from './ui/styles';
import PublicRoute from './components/route-control/PublicRoute'
import PrivateRoute from './components/route-control/PrivateRoute'
import Register from './pages/Register'
import Sidebar, { DRAWER_WIDTH_EXPANDED, DRAWER_WIDTH_COLLAPSED } from './components/Sidebar'
import Wallets from './pages/Wallets'
import Wallet from './pages/Wallet'
import WelcomeTemplate from './pages/welcometemplate'
import ProviderCard from './components/providers/ProviderCard'
import CreateProvider from './pages/Create';
import Nextmain from './pages/Nextmain'
import VerifyToken from './components/2FA/verify-token'
import Settings from './components/settings/Settings'
import ResendTokenForm from './components/2FA/ResendTokenForm'
import EmailVerificationComponent from './components/settings/verify'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { LanguageProvider } from './hooks/LanguageContext';
import './i18n'; 
import Chatcomponent from './components/providers/Chat';
import ProviderChatComponent from './components/providers/ProviderChatComponent';
import Dashboard from './pages/Dashboard'
import P2P from './pages/P2P'
import P2POrderChat from './components/p2p/P2POrderChat'
import { Menu as MenuIcon } from './ui/icons';

const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/nextmain', '/verifytoken', '/resendtoken'];

function AppContent() {
    const { auth, setAuth, loading } = useFindUser();
    const { mode } = useThemeMode();
    const location = useLocation();
    const muiTheme = useTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
    const [sidebarOpen, setSidebarOpen] = useState(true);
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

    const isDark = mode === 'dark';

    const mainContentStyle = {
        flex: 1,
        marginLeft: (isAuthenticated && !isPublicRoute && !isMobile) ? (sidebarOpen ? DRAWER_WIDTH_EXPANDED : DRAWER_WIDTH_COLLAPSED) : 0,
        transition: 'margin-left 0.3s ease-in-out',
        minHeight: '100vh',
        padding: isMobile ? '16px' : '24px',
        width: (isAuthenticated && !isPublicRoute) ? undefined : '100%',
    };

    return (
        <AuthContext.Provider value={{ auth, setAuth, loading }}>
            <SocketProvider>
                <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: isDark ? '#0F0F1A' : '#F6F8FA' }}>
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
                        <IconButton
                            onClick={handleMobileOpen}
                            style={{
                                position: 'fixed',
                                top: 12,
                                left: 12,
                                zIndex: 80,
                                color: isDark ? '#FFFFFF' : '#1A1A2E',
                                backgroundColor: isDark ? 'rgba(45,45,68,0.9)' : 'rgba(255,255,255,0.95)',
                                border: `1px solid ${isDark ? '#2D2D44' : '#E5E7EB'}`,
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Box
                        component="main"
                        style={mainContentStyle}
                    >
                        <Container maxWidth="xl" sx={{ p: 0 }}>
                            <Switch>
                                <PrivateRoute exact path='/' component={Dashboard} />
                                <PrivateRoute exact path="/wallets" component={Wallets} />
                                <PrivateRoute exact path="/wallet/:walletId" component={Wallet} />
                                <PrivateRoute exact path="/providers" component={ProviderCard} />
                                <PrivateRoute exact path="/create" component={CreateProvider} />
                                <PrivateRoute exact path='/welcome' component={WelcomeTemplate}/>
                                <PrivateRoute exact path='/settings' component={Settings}/>
                                <PrivateRoute exact path='/verifyemail' component={EmailVerificationComponent}/>
                                <PrivateRoute exact path='/chat' component={Chatcomponent}/>
                                <PrivateRoute exact path='/providerchat' component={ProviderChatComponent}/>
                                <PrivateRoute exact path='/p2p' component={P2P}/>
                                <PrivateRoute exact path='/p2p/order/:orderId' component={P2POrderChat}/>
                                <PublicRoute exact path='/login' component={Login} />
                                <PublicRoute exact path='/register' component={Register} />
                                <PublicRoute exact path='/forgot-password' component={ForgotPassword} />
                                <PublicRoute exact path='/reset-password' component={ResetPassword} />
                                <PublicRoute exact path='/nextmain' component={Nextmain}/>
                                <PublicRoute exact path='/verifytoken' component={VerifyToken} />
                                <PublicRoute exact path='/resendtoken' component={ResendTokenForm}/>
                            </Switch>
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
