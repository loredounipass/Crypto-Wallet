import React from 'react';
import { Link } from 'react-router-dom';
import { mobileNavItemStyle, mobileNavButtonExtraStyle, notifDotStyle } from './navStyles';

// ITEM DE LA BARRA: LINK (NAVEGACION) O BUTTON (ACCION). MISMO ESTILO EN AMBOS.
export default function MobileNavItem({ to, onClick, label, title, dot, children }) {
  const a11y = { 'aria-label': label, title: title || label };
  if (to) {
    return (
      <Link to={to} style={mobileNavItemStyle} {...a11y}>
        {children}
      </Link>
    );
  }
  return (
    <button
      onClick={onClick}
      style={{
        ...mobileNavItemStyle,
        ...mobileNavButtonExtraStyle,
        ...(dot ? { position: 'relative' } : {}),
      }}
      {...a11y}
    >
      {children}
      {dot && <span style={notifDotStyle} />}
    </button>
  );
}
