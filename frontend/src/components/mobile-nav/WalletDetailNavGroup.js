import React from 'react';
import { Box } from '../../ui/material';
import MobileNavItem from './MobileNavItem';
import { mobileNavGroupStyle } from './navStyles';
import {
  SellP2PIcon, BuyP2PIcon, ChatIcon, SwapIcon, BellIcon,
} from './navIcons';

// GRUPO DEL DETALLE DE WALLET (/wallet/:id): VENDER + COMPRAR P2P + CHAT + SWAP + NOTIFICACIONES
export default function WalletDetailNavGroup({ onToggleNotif }) {
  return (
    <Box style={mobileNavGroupStyle}>
      <MobileNavItem to="/p2p" label="Vender P2P">
        <SellP2PIcon />
      </MobileNavItem>
      <MobileNavItem to="/create" label="Comprar P2P">
        <BuyP2PIcon />
      </MobileNavItem>
      <MobileNavItem to="/chat" label="Chat">
        <ChatIcon />
      </MobileNavItem>
      <MobileNavItem to="/swap" label="Swap">
        <SwapIcon />
      </MobileNavItem>
      <MobileNavItem onClick={onToggleNotif} label="Notificaciones" dot>
        <BellIcon />
      </MobileNavItem>
    </Box>
  );
}
