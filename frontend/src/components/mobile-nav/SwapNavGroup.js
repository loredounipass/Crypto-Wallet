import React from 'react';
import { Box } from '../../ui/material';
import MobileNavItem from './MobileNavItem';
import { mobileNavGroupStyle } from './navStyles';
import {
  BellIcon, WalletIcon, DashboardIcon, ForumIcon,
} from './navIcons';

// GRUPO DE SWAP (/swap): DASHBOARD + NOTIFICACIONES + BILLETERAS + FORO
export default function SwapNavGroup({ onToggleNotif }) {
  return (
    <Box style={mobileNavGroupStyle}>
      <MobileNavItem to="/" label="Dashboard">
        <DashboardIcon />
      </MobileNavItem>
      <MobileNavItem onClick={onToggleNotif} label="Notificaciones" dot>
        <BellIcon />
      </MobileNavItem>
      <MobileNavItem to="/wallets" label="Mis billeteras">
        <WalletIcon />
      </MobileNavItem>
      <MobileNavItem to="/feed" label="Foro">
        <ForumIcon />
      </MobileNavItem>
    </Box>
  );
}
