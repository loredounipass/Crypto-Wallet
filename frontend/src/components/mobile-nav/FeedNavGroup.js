import React from 'react';
import { Box } from '../../ui/material';
import MobileNavItem from './MobileNavItem';
import { mobileNavGroupStyle } from './navStyles';
import { toggleFeedExtras } from '../feed/FeedExtrasDrawer';
import {
  FeedPanelIcon, ChatIcon, MarketplaceIcon, SellP2PIcon, BellIcon,
} from './navIcons';

// GRUPO DEL FORO (/feed): PANEL + CHAT + MARKETPLACE + VENDER P2P + NOTIFICACIONES
export default function FeedNavGroup({ onToggleNotif }) {
  return (
    <Box style={mobileNavGroupStyle}>
      <MobileNavItem onClick={toggleFeedExtras} label="panel del feed" title="Donaciones, links y contactos">
        <FeedPanelIcon />
      </MobileNavItem>
      <MobileNavItem to="/chat" label="Chat">
        <ChatIcon />
      </MobileNavItem>
      <MobileNavItem to="/marketplace" label="Marketplace">
        <MarketplaceIcon />
      </MobileNavItem>
      <MobileNavItem to="/p2p" label="Vender P2P">
        <SellP2PIcon />
      </MobileNavItem>
      <MobileNavItem onClick={onToggleNotif} label="Notificaciones" dot>
        <BellIcon />
      </MobileNavItem>
    </Box>
  );
}
