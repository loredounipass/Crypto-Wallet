import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, IconButton } from '../../ui/material';
import { Menu as MenuIcon } from '../../ui/icons';
import { mobileBarStyle } from './navStyles';
import FeedNavGroup from './FeedNavGroup';
import DashboardNavGroup from './DashboardNavGroup';
import WalletsNavGroup from './WalletsNavGroup';
import WalletDetailNavGroup from './WalletDetailNavGroup';
import SwapNavGroup from './SwapNavGroup';
import P2PSellNavGroup from './P2PSellNavGroup';
import NotifDropdown from './NotifDropdown';

// BARRA SUPERIOR MOVIL (SOLO <=md): MENU + ICONOS CENTRALES SEGUN LA RUTA
export default function MobileTopBar({ onMobileMenuToggle }) {
  const location = useLocation();
  const [showNotif, setShowNotif] = useState(false);
  const toggleNotif = () => setShowNotif((v) => !v);
  const showNotifPanel =
    location.pathname.startsWith('/feed') ||
    location.pathname === '/' ||
    location.pathname === '/wallets' ||
    location.pathname.startsWith('/wallet/') ||
    location.pathname === '/swap' ||
    location.pathname.startsWith('/p2p');

  return (
    <Box style={mobileBarStyle}>
      <IconButton
        onClick={onMobileMenuToggle}
        style={{
          color: '#FFFFFF',
          position: 'absolute',
          left: 16,
        }}
      >
        <MenuIcon />
      </IconButton>
      {location.pathname.startsWith('/feed') && (
        <FeedNavGroup onToggleNotif={toggleNotif} />
      )}
      {location.pathname === '/' && (
        <DashboardNavGroup onToggleNotif={toggleNotif} />
      )}
      {location.pathname === '/wallets' && (
        <WalletsNavGroup onToggleNotif={toggleNotif} />
      )}
      {location.pathname.startsWith('/wallet/') && (
        <WalletDetailNavGroup onToggleNotif={toggleNotif} />
      )}
      {location.pathname === '/swap' && (
        <SwapNavGroup onToggleNotif={toggleNotif} />
      )}
      {location.pathname.startsWith('/p2p') && (
        <P2PSellNavGroup onToggleNotif={toggleNotif} />
      )}
      {showNotif && showNotifPanel && (
        <NotifDropdown open={showNotif} onClose={() => setShowNotif(false)} />
      )}
    </Box>
  );
}
