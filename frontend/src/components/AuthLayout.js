import React from 'react';
import { Box } from '../ui/material';
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

const AuthLayout = ({ children, subtitle }) => {
  return (
    <Box className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#0F0F1A] box-border">
      <Box className="w-full max-w-[360px]">
        <Logo />
        {subtitle && (
          <Box className="text-[#9CA3AF] text-xs mb-6 mt-2 text-center">
            {subtitle}
          </Box>
        )}
        {children}
      </Box>
    </Box>
  );
};

export { inputSx, buttonStyle };
export default AuthLayout;
