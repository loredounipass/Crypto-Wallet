import React from 'react';
import { Box } from '../../ui/material';
import MobileNavItem from './MobileNavItem';
import { mobileNavGroupStyle } from './navStyles';
import {
  DashboardIcon, ForumIcon, ChatIcon, SupportIcon, BellIcon,
} from './navIcons';

// GRUPO DE BILLETERAS (/wallets): DASHBOARD + FORO + CHAT + SOPORTE + NOTIFICACIONES
export default function WalletsNavGroup({ onToggleNotif }) {
  return (
    <Box style={mobileNavGroupStyle}>
      <MobileNavItem to="/" label="Dashboard">
        <DashboardIcon />
      </MobileNavItem>
      <MobileNavItem to="/feed" label="Foro">
        <ForumIcon />
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
