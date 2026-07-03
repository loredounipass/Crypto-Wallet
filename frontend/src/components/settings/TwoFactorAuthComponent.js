import React, { useState, useEffect, use } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../hooks/AuthContext';
import User from '../../services/user';
import useAuth from '../../hooks/useAuth';
import TransactionToast from '../TransactionToast';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '../../ui/icons';

import './Settings.css';

// Components
const Switch = ({ checked, onChange, disabled }) => (
  <button
    onClick={disabled ? null : onChange}
    className={`relative h-6 w-12 rounded-xl border-0 p-[2px] transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    style={{ backgroundColor: checked ? 'var(--settings-primary)' : 'var(--settings-border)' }}
  >
    <span
      className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}
    />
  </button>
);

const TwoFactorAuthComponent = () => {
  const { t } = useTranslation();
  const { auth } = use(AuthContext);
  const { updateTokenStatus, error: authError } = useAuth();
  
  

  const [isTokenEnabled, setIsTokenEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTokenStatus = async () => {
      if (!auth) {
        setLoading(false);
        return;
      }
      try {
        const response = await User.getTokenStatus({ signal: controller.signal });
        // Handle both { isTokenEnabled: boolean } and { data: { isTokenEnabled: boolean } }
        const tokenStatus = response?.data?.isTokenEnabled ?? response?.data?.data?.isTokenEnabled;
        setIsTokenEnabled(Boolean(tokenStatus));
      } catch (err) {
        // Ignore cancellation errors - these are expected when component unmounts
        const isCanceled = err.name === 'CanceledError' || 
                          err.name === 'AbortError' || 
                          err.code === 'ERR_CANCELED' ||
                          err.message?.includes('canceled');
        if (!isCanceled) {
          setToast({ kind: 'error', message: err.message });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTokenStatus();
    return () => controller.abort();
  }, [auth]);

  const toggleTwoFactorAuth = () => {
    if (isTokenEnabled) {
      setShowWarning(true);
      setConfirmDialogOpen(true);
    } else {
      updateTokenStatusOnly(true);
    }
  };
  const updateTokenStatusOnly = async (newStatus) => {
    const previousStatus = isTokenEnabled;
    setIsTokenEnabled(newStatus);
    setShowWarning(!newStatus);
    setLoading(true);
    try {
      const res = await updateTokenStatus({ isTokenEnabled: newStatus });
      if (res && !res.error) {
        setToast({ 
          kind: 'success', 
          message: res.message || res.msg 
        });
      } else {
        setIsTokenEnabled(previousStatus);
        setShowWarning(!previousStatus);
        if (res?.error) setToast({ kind: 'error', message: res.error });
        if (!res && authError) setToast({ kind: 'error', message: authError });
      }
      return res;
    } finally {
      setLoading(false);
    }
  };



  const handleConfirmDialogClose = (confirm) => {
    setConfirmDialogOpen(false);
    if (confirm) {
      updateTokenStatusOnly(false);
    }
  };


  return (
    <div className="w-full">
      <div className="border-0 bg-transparent p-0 shadow-none">
        <div className="mb-6 flex items-center gap-4 border-b pb-4" style={{ borderColor: 'var(--settings-border)' }}>
          <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
            <CheckCircleIcon className="text-[28px]" style={{ color: 'var(--settings-primary)' }} />
          </div>
          <h2 className="m-0 text-[20px] font-semibold" style={{ color: 'var(--settings-text)' }}>{t('two_factor_auth_title')}</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl border p-4" style={{ borderColor: 'var(--settings-border)', backgroundColor: 'var(--settings-bg)' }}>
        <div style={{ color: 'var(--settings-text)' }}>
          <span style={{ marginRight: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {isTokenEnabled ? t('disable') : t('enable')}
          </span>
          {isTokenEnabled && <CheckCircleIcon style={{ color: 'var(--settings-success)', fontSize: '1.125rem' }} />}
        </div>
        <Switch 
          checked={isTokenEnabled} 
          onChange={toggleTwoFactorAuth} 
          disabled={loading} 
        />
      </div>

      {isTokenEnabled && (
        <p className="mb-4 text-sm" style={{ color: 'var(--settings-success)' }}>
          {t('two_factor_active')}
        </p>
      )}

      {showWarning && (
        <div className="mt-4 rounded-xl px-4 py-3 text-sm font-medium" style={{ 
          border: '1px solid rgba(239,68,68,0.2)', 
          backgroundColor: 'rgba(239,68,68,0.1)', 
          color: 'var(--settings-danger)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <WarningIcon style={{ color: 'var(--settings-danger)', marginRight: '0.5rem' }} fontSize="small" />
            <span>{t('two_factor_disable_warning')}</span>
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {confirmDialogOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.6)] p-4 backdrop-blur-[4px]">
          <div className="w-full max-w-[400px] rounded-2xl border p-6 shadow-[0_10px_25px_rgba(0,0,0,0.2)]" style={{ borderColor: 'var(--settings-border)', backgroundColor: 'var(--settings-card)' }}>
            <h3 className="m-0 mb-3 text-[18px] font-semibold" style={{ color: 'var(--settings-text)' }}>{t('confirm_disable_title')}</h3>
            <p className="mb-6 text-sm leading-[1.5]" style={{ color: 'var(--settings-muted)' }}>
              {t('confirm_disable_message')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleConfirmDialogClose(false)}
                className="cursor-pointer rounded-[10px] border-0 px-4 py-[10px] text-sm font-semibold text-white transition-all"
                style={{ backgroundColor: 'var(--settings-danger)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--settings-danger-hover)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--settings-danger)'}
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleConfirmDialogClose(true)}
                className="cursor-pointer rounded-[10px] border px-4 py-[10px] text-sm font-semibold transition-all hover:opacity-80"
                style={{ borderColor: 'var(--settings-border)', backgroundColor: 'var(--settings-bg)', color: 'var(--settings-text)' }}
              >
                {t('disable')}
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionToast toast={toast} onClose={() => setToast(null)} />
         </div>
       </div>
     </div>
   );
};

export default TwoFactorAuthComponent;
