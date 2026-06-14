import React from 'react';
import { Box, Link } from '../ui/material';
import { Link as RouterLink } from 'react-router-dom';
import Logo from './Logo';

const inputSx = {
  borderRadius: 12,
  border: '1px solid rgba(99, 102, 241, 0.3)',
  backgroundColor: 'rgba(15, 15, 26, 0.8)',
  color: '#FFFFFF',
  backdropFilter: 'blur(10px)',
};

const buttonStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 12,
  textTransform: 'none',
  fontSize: 16,
  fontWeight: 600,
  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)',
  boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
};

const footerStyle = {
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  padding: '1rem',
  marginTop: 'auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '1.5rem',
  flexWrap: 'wrap',
  color: '#94a3b8',
  fontSize: '0.75rem',
};

const AuthLayout = ({ children, subtitle }) => {
  return (
    <Box className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#0F0F1A] box-border">
      <Box className="w-full max-w-[360px]" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <RouterLink to="/landing" style={{ textDecoration: 'none' }}>
          <Logo />
        </RouterLink>
        {subtitle && (
          <Box className="text-[#9CA3AF] text-xs mb-6 mt-2 text-center">
            {subtitle}
          </Box>
        )}
        {children}
      </Box>
      <Box sx={footerStyle}>
        <Link component={RouterLink} to="/landing" sx={{ color: '#94a3b8', textDecoration: 'none', '&:hover': { color: '#8B5CF6' } }}>
          Home
        </Link>
        <Link component={RouterLink} to="/privacy" sx={{ color: '#94a3b8', textDecoration: 'none', '&:hover': { color: '#8B5CF6' } }}>
          Privacy Policy
        </Link>
        <Link component={RouterLink} to="/terms" sx={{ color: '#94a3b8', textDecoration: 'none', '&:hover': { color: '#8B5CF6' } }}>
          Terms & Conditions
        </Link>
        <Box component="span" sx={{ color: '#64748b' }}>
          &copy; {new Date().getFullYear()} BrivoTrust. All rights reserved.
        </Box>
      </Box>
    </Box>
  );
};

export { inputSx, buttonStyle };
export default AuthLayout;
