import React from 'react';
import { Box } from '../../ui/material';
import MobileNavItem from './MobileNavItem';
import { mobileNavGroupStyle } from './navStyles';
import {
  DashboardIcon, BuyP2PIcon, WalletIcon, ChatIcon, BellIcon,
} from './navIcons';

// GRUPO DE VENDER P2P (/p2p): DASHBOARD + COMPRAR P2P + BILLETERAS + CHAT + NOTIFICACIONES
export default function P2PSellNavGroup({ onToggleNotif }) {
  return (
    <Box style={mobileNavGroupStyle}>
      <MobileNavItem to="/" label="Dashboard">
        <DashboardIcon />
      </MobileNavItem>
      <MobileNavItem to="/wallets" label="Mis billeteras">
        <WalletIcon />
      </MobileNavItem>
      <MobileNavItem to="/create" label="Comprar P2P">
        <BuyP2PIcon />
      </MobileNavItem>
      <MobileNavItem to="/chat" label="Chat">
        <ChatIcon />
      </MobileNavItem>
      <MobileNavItem onClick={onToggleNotif} label="Notificaciones" dot>
        <BellIcon />
      </MobileNavItem>
    </Box>
  );
}
