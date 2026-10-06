// ESTILOS COMPARTIDOS DE LA BARRA SUPERIOR MOVIL (EXTRAIDOS DE App.js SIN CAMBIOS)
export const mobileBarStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '64px',
  zIndex: 1100,
  backgroundColor: 'rgba(26, 26, 46, 0.85)',
  backdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
};

export const mobileNavGroupStyle = {
  position: 'absolute',
  left: '56%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
  padding: '0 8px',
};

export const mobileNavItemStyle = {
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px',
  borderRadius: '10px',
};

export const mobileNavButtonExtraStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
};

export const notifDotStyle = {
  position: 'absolute',
  top: 9,
  right: 9,
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#F87171',
  border: '1px solid #1A1A2E',
};
