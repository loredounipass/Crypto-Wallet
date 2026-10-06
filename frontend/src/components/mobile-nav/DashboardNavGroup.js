import React from 'react';
import { Box } from '../../ui/material';
import MobileNavItem from './MobileNavItem';
import { mobileNavGroupStyle } from './navStyles';
import {
  ForumIcon, WalletIcon, ChatIcon, SupportIcon, BellIcon,
} from './navIcons';

// GRUPO DEL DASHBOARD (/): FORO + BILLETERAS + CHAT + SOPORTE + NOTIFICACIONES
export default function DashboardNavGroup({ onToggleNotif }) {
  return (
    <Box style={mobileNavGroupStyle}>
      <MobileNavItem to="/feed" label="Foro">
        <ForumIcon />
      </MobileNavItem>
      <MobileNavItem to="/wallets" label="Mis billeteras">
        <WalletIcon />
      </MobileNavItem>
      <MobileNavItem to="/chat" label="Chat">
        <ChatIcon />
      </MobileNavItem>
      <MobileNavItem to="/supportChat" label="Brivo Soporte">
        <SupportIcon />
      </MobileNavItem>
      <MobileNavItem onClick={onToggleNotif} label="Notificaciones" dot>
        <BellIcon />
      </MobileNavItem>
    </Box>
  );
}
