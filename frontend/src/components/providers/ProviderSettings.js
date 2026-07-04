import React, { useEffect, useState, use, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import useProviderSettings from '../../hooks/useProviderSettings';
import useAllWallets from '../../hooks/useAllWallets';
import { AuthContext } from '../../hooks/AuthContext';

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #2D2D44',
  backgroundColor: '#1A1A2E',
  color: '#F1F5F9',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const btnPrimary = {
  padding: '9px 16px',
  borderRadius: 10,
  border: 'none',
  backgroundColor: '#7C3AED',
  color: '#FFF',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const btnDanger = {
  padding: '6px 12px',
  borderRadius: 8,
  border: '1px solid rgba(239,68,68,0.3)',
  backgroundColor: 'transparent',
  color: '#FCA5A5',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
};

const sectionCard = {
  borderRadius: 14,
  border: '1px solid #2D2D44',
  backgroundColor: '#1A1A2E',
  padding: 20,
  marginBottom: 16,
};

const toggleTrack = (enabled) => ({
  width: 44,
  height: 24,
  borderRadius: 12,
  backgroundColor: enabled ? '#7C3AED' : '#2D2D44',
  position: 'relative',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  flexShrink: 0,
});

const toggleThumb = (enabled) => ({
  width: 18,
  height: 18,
  borderRadius: '50%',
  backgroundColor: '#FFF',
  position: 'absolute',
  top: 3,
  left: enabled ? 23 : 3,
  transition: 'left 0.2s',
  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
});

export default function ProviderSettings({ open, onClose }) {
  const { t } = useTranslation();
  const { auth } = use(AuthContext);
  const { settings, isLoading, getSettings, addPaymentMethod, deletePaymentMethod, toggleDestinationWallet } = useProviderSettings();
  const { allWalletInfo: wallets, refreshWallets } = useAllWallets();

  const [newMethod, setNewMethod] = useState('');

  const authRef = useRef(auth);
  useEffect(() => {
    authRef.current = auth;
  });

  useEffect(() => {
    if (!open || !auth?._id) return;

    const controller = new AbortController();

    const doFetch = async () => {
      if (!authRef.current?._id) return;
      await getSettings(controller.signal);
      if (authRef.current?._id) {
        refreshWallets();
      }
    };
    doFetch();

    return () => {
      controller.abort();
    };
  }, [open, auth, getSettings, refreshWallets]);

  useEffect(() => {
    if (open && !auth?._id) {
      onClose();
    }
  }, [open, auth, onClose]);

  if (!open) return null;

  const handleAddMethod = async () => {
    if (!newMethod.trim()) return;
    try {
      await addPaymentMethod({ paymentMethod: newMethod.trim() });
      setNewMethod('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMethod = async (method) => {
    try {
      await deletePaymentMethod(method);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = async (address) => {
    try {
      await toggleDestinationWallet({ address });
    } catch (e) {
      console.error(e);
    }
  };

  const isWalletEnabled = (walletAddr) => {
    if (!settings?.destinationWallets) return false;
    const found = settings.destinationWallets.find(w => w.address === walletAddr);
    return found ? found.enabled : false;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
        borderRadius: 20, padding: '28px 28px 24px',
        background: 'linear-gradient(180deg, #131327 0%, #0C0C17 100%)',
        border: '1px solid #1F1F33',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#F1F5F9' }}>
            {t('p2p_provider_settings')}
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4,
          }}>✕</button>
        </div>

        {isLoading && !settings && (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontSize: 14 }}>
            {t('p2p_loading')}
          </div>
        )}

        {settings && (
          <>
            {/* Payment Methods */}
            <div style={sectionCard}>
              <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>
                {t('p2p_payment_methods')}
              </h4>

              {settings.paymentMethods.length === 0 && (
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748B' }}>
                  {t('p2p_no_payment_methods')}
                </p>
              )}

              {settings.paymentMethods.map((method) => (
                <div key={method} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8, marginBottom: 6,
                  backgroundColor: 'rgba(15,15,26,0.5)',
                }}>
                  <span style={{ fontSize: 13, color: '#E2E8F0' }}>{method}</span>
                  <button onClick={() => handleDeleteMethod(method)} style={btnDanger}>
                    {t('p2p_delete')}
                  </button>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input
                  style={inputStyle}
                  placeholder={t('p2p_add_payment_method_placeholder')}
                  value={newMethod}
                  onChange={(e) => setNewMethod(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMethod()}
                />
                <button onClick={handleAddMethod} style={btnPrimary}>
                  {t('p2p_add')}
                </button>
              </div>
            </div>

            {/* Destination Wallets - Toggle from existing wallets */}
            <div style={sectionCard}>
              <h4 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>
                {t('p2p_destination_wallets')}
              </h4>

              {wallets.length === 0 && (
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748B' }}>
                  {t('p2p_no_wallets')}
                </p>
              )}

              {wallets.map((w) => {
                const enabled = isWalletEnabled(w.address);
                return (
                  <div key={w.address} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                    backgroundColor: 'rgba(15,15,26,0.5)',
                    opacity: enabled ? 1 : 0.5,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: '#E2E8F0', fontWeight: 600 }}>
                        {w.coin} <span style={{ color: '#64748B', fontWeight: 400 }}>(Chain {w.chainId})</span>
                      </div>
                      <div style={{
                        fontSize: 12, color: '#64748B', fontFamily: 'monospace',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {w.address}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        backgroundColor: enabled ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                        color: enabled ? '#10B981' : '#64748B',
                      }}>
                        {enabled ? t('p2p_enabled') : t('p2p_disabled')}
                      </span>
                      <div
                        style={toggleTrack(enabled)}
                        onClick={() => handleToggle(w.address)}
                      >
                        <div style={toggleThumb(enabled)} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Close button */}
        <button onClick={onClose} style={{
          width: '100%', padding: '11px 0', borderRadius: 12,
          border: '1px solid #2D2D44', backgroundColor: 'transparent',
          color: '#94A3B8', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', marginTop: 4,
        }}>
          {t('p2p_close')}
        </button>
      </div>
    </div>
  );
}
