import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Link } from '../ui/material';
import { Link as RouterLink } from 'react-router-dom';
import Logo from './Logo';

const inputSx = {
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: '#FFFFFF',
  backdropFilter: 'blur(12px)',
  transition: 'all 0.3s ease-in-out',
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none', // Remove default MUI border
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  '&.Mui-focused': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: '1px solid #8B5CF6',
    boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)',
  },
  '& input': {
    color: '#FFFFFF !important',
    transition: 'background-color 5000s ease-in-out 0s',
    '&:-webkit-autofill': {
      WebkitBoxShadow: '0 0 0 1000px rgba(15, 15, 26, 0.9) inset !important',
      WebkitTextFillColor: '#FFFFFF !important',
      transition: 'background-color 5000s ease-in-out 0s',
      borderRadius: '16px',
    },
    '&:-webkit-autofill:hover': {
      WebkitBoxShadow: '0 0 0 1000px rgba(25, 25, 40, 0.9) inset !important',
    },
    '&:-webkit-autofill:focus': {
      WebkitBoxShadow: '0 0 0 1000px rgba(35, 35, 55, 0.9) inset !important',
    },
  },
};

const buttonStyle = {
  width: '100%',
  padding: '14px 24px',
  borderRadius: '16px',
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 700,
  letterSpacing: '0.5px',
  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  color: '#FFFFFF',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(139, 92, 246, 0.6)',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 1) 0%, rgba(139, 92, 246, 1) 100%)',
  },
  '&:active': {
    transform: 'translateY(1px)',
  }
};

const footerStyle = {
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  padding: '1.5rem',
  marginTop: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '2rem',
  flexWrap: 'wrap',
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: '0.85rem',
  zIndex: 10,
  width: '100%',
};

const AuthLayout = ({ children, subtitle }) => {
  const { t } = useTranslation();
  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#05050A',
      overflow: 'hidden',
      zIndex: 9999, // Ensure it sits above any App.js shell elements
    }}>
      {/* Animated Liquid Background Blobs */}
      <Box sx={{
        position: 'absolute',
        top: '-10%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
        animation: 'blobAnimation 15s infinite alternate ease-in-out',
        zIndex: 1,
      }} />
      <Box sx={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '60vw',
        height: '60vw',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0) 70%)',
        animation: 'blobAnimation 20s infinite alternate-reverse ease-in-out',
        animationDelay: '2s',
        zIndex: 1,
      }} />
      <Box sx={{
        position: 'absolute',
        top: '20%',
        right: '10%',
        width: '30vw',
        height: '30vw',
        background: 'radial-gradient(circle, rgba(33, 134, 235, 0.1) 0%, rgba(33, 134, 235, 0) 70%)',
        animation: 'blobAnimation 12s infinite alternate ease-in-out',
        animationDelay: '4s',
        zIndex: 1,
      }} />

      {/* No Box container, just the form elements natively over the background */}
      <Box sx={{
        width: '100%',
        maxWidth: '360px',
        margin: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        padding: { xs: '2rem', sm: '1rem' },
      }}>
        <RouterLink to="/landing" style={{ textDecoration: 'none', marginBottom: '1.5rem', display: 'block', transform: 'scale(1.1)' }}>
          <Logo />
        </RouterLink>
        {subtitle && (
          <Box sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.95rem',
            marginBottom: '2.5rem',
            textAlign: 'center',
            fontWeight: 500,
            letterSpacing: '0.3px'
          }}>
            {subtitle}
          </Box>
        )}
        <Box sx={{ width: '100%' }}>
          {children}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={footerStyle}>
        <Link component={RouterLink} to="/landing" sx={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', '&:hover': { color: '#8B5CF6' } }}>
          {t('auth_home')}
        </Link>
        <Link component={RouterLink} to="/privacy" sx={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', '&:hover': { color: '#8B5CF6' } }}>
          Privacy Policy
        </Link>
        <Link component={RouterLink} to="/terms" sx={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s', '&:hover': { color: '#8B5CF6' } }}>
          Terms & Conditions
        </Link>
        <Box component="span" sx={{ color: 'rgba(255, 255, 255, 0.3)' }}>
          &copy; {new Date().getFullYear()} BrivoTrust.
        </Box>
      </Box>
    </Box>
  );
};

export { inputSx, buttonStyle };
export default AuthLayout;
