import React from 'react';
import { Box, Typography } from '../ui/material';

const Logo = ({ variant = 'auth' }) => {
  const isSidebarExpanded = variant === 'sidebar-expanded';
  const isSidebarCollapsed = variant === 'sidebar-collapsed';
  const hexagonPath = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

  if (isSidebarCollapsed) {
    return (
      <Box className="relative w-10 h-10 flex items-center justify-center mx-auto">
        <Box
          className="absolute inset-0 flex items-center justify-center"
          style={{
            clipPath: hexagonPath,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)",
          }}
        >
          <Typography className="relative z-10 text-white font-bold text-lg" style={{ textShadow: "0 0 10px rgba(255,255,255,0.5)" }}>
            B
          </Typography>
        </Box>
      </Box>
    );
  }

  if (isSidebarExpanded) {
    return (
      <Box className="flex items-center gap-3">
        <Box className="relative w-12 h-12 flex items-center justify-center">
          <Box
            className="absolute inset-0 flex items-center justify-center"
            style={{
              clipPath: hexagonPath,
              background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)",
            }}
          >
            <Typography className="relative z-10 text-white font-bold text-xl" style={{ textShadow: "0 0 10px rgba(255,255,255,0.5)" }}>
              B
            </Typography>
          </Box>
        </Box>
        <Typography
          component="h1"
          className="font-bold text-lg tracking-wide"
          style={{ textShadow: "0 0 20px rgba(99, 102, 241, 0.5)", color: 'white' }}
        >
          Block<span className="text-[#8B5CF6]">Vault</span>
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col items-center gap-4 mb-6">
      <Box className="relative w-16 h-16 flex items-center justify-center">
        <Box
          className="absolute inset-0 opacity-75 blur-xl"
          style={{
            background: "linear-gradient(135deg, #6366F1, #8B5CF6, #2186EB)",
            borderRadius: "50%",
          }}
        />
        <Box
          className="relative z-10 w-14 h-14 flex items-center justify-center"
          style={{
            clipPath: hexagonPath,
            background: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)",
            boxShadow: "0 0 30px rgba(99, 102, 241, 0.6), inset 0 0 20px rgba(255,255,255,0.1)",
          }}
        >
          <Typography className="text-white font-bold text-2xl" style={{ textShadow: "0 0 10px rgba(255,255,255,0.5)" }}>
            B
          </Typography>
        </Box>
      </Box>
      <Box className="text-center">
        <Typography
          component="h1"
          className="font-bold text-2xl sm:text-3xl"
        >
          <span className="text-[#111827] dark:text-white">Block</span><span className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#2186EB] bg-clip-text text-transparent">Vault</span>
        </Typography>
      </Box>
    </Box>
  );
};

export default Logo;
