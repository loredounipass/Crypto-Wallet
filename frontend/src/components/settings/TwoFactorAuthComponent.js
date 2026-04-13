import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import User from '../../services/user';
import useAuth from '../../hooks/useAuth';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
} from '../../ui/icons';
import { useThemeMode } from '../../ui/styles';

const TwoFactorAuthComponent = () => {
  const { auth } = useContext(AuthContext);
  const { updateTokenStatus } = useAuth();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [isTokenEnabled, setIsTokenEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: '' });
  const [error, setError] = useState(null);

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
          setError(err.message || 'Error fetching token status');
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
      setSnackbar({ 
        open: true, 
        message: newStatus ? 'Autenticación de dos factores activada.' : 'Autenticación de dos factores desactivada.', 
        severity: 'success' 
      });
      return res;
    } catch (err) {
      setIsTokenEnabled(previousStatus);
      setShowWarning(!previousStatus);
      setError(err?.message || 'No se pudo actualizar el estado.');
      return null;
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

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(handleCloseSnackbar, 3000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  // Components
  const Switch = ({ checked, onChange, disabled }) => (
    <button
      onClick={disabled ? null : onChange}
      className={`relative h-6 w-12 rounded-xl border-0 p-[2px] transition-colors ${checked ? 'bg-[#2186EB]' : (isDark ? 'bg-[#2D2D44]' : 'bg-[#E5E7EB]')} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`}
      />
    </button>
  );

  return (
    <div className="w-full">
      <div className="border-0 bg-transparent p-0 shadow-none">
        <div className={`mb-6 flex items-center gap-4 border-b pb-4 ${isDark ? 'border-[#2D2D44]' : 'border-[#E5E7EB]'}`}>
          <div className="flex items-center justify-center rounded-xl bg-[rgba(33,134,235,0.1)] p-3">
            <CheckCircleIcon className="text-[28px] text-[#2186EB]" />
          </div>
          <h2 className={`m-0 text-[20px] font-semibold ${isDark ? 'text-white' : 'text-[#111827]'}`}>2FA Auth</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className={`flex items-center justify-between rounded-xl border p-4 ${isDark ? 'border-[#2D2D44] bg-[#0F0F1A]' : 'border-[#E5E7EB] bg-[#F6F8FA]'}`}>
        <div className={`flex items-center ${isDark ? 'text-white' : 'text-[#111827]'}`}>
          <span style={{ marginRight: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {isTokenEnabled ? 'Desactivar' : 'Activar'}
          </span>
          {isTokenEnabled && <CheckCircleIcon style={{ color: '#22c55e', fontSize: '1.125rem' }} />}
        </div>
        <Switch 
          checked={isTokenEnabled} 
          onChange={toggleTwoFactorAuth} 
          disabled={loading} 
        />
      </div>

      {isTokenEnabled && (
        <p className="mb-4 text-sm text-[#22c55e]">
          La autenticación de dos factores está activa.
        </p>
      )}

      {showWarning && (
        <div className="mt-4 rounded-xl border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)] px-4 py-3 text-sm font-medium text-[#ef4444]">
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <WarningIcon style={{ color: '#ef4444', marginRight: '0.5rem' }} fontSize="small" />
            <span>Desactivar la autenticación de dos factores pone en riesgo tu cuenta.</span>
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {confirmDialogOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(0,0,0,0.6)] p-4 backdrop-blur-[4px]">
          <div className={`w-full max-w-[400px] rounded-2xl border p-6 shadow-[0_10px_25px_rgba(0,0,0,0.2)] ${isDark ? 'border-[#2D2D44] bg-[#1A1A2E]' : 'border-[#E5E7EB] bg-white'}`}>
            <h3 className={`m-0 mb-3 text-[18px] font-semibold ${isDark ? 'text-white' : 'text-[#111827]'}`}>Confirmar Desactivación</h3>
            <p className={`mb-6 text-sm leading-[1.5] ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
              ¿Estás seguro de que deseas desactivar la autenticación de dos factores? Esto pone en riesgo tu cuenta a cibercriminales.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleConfirmDialogClose(false)}
                className="cursor-pointer rounded-[10px] border-0 bg-[#ef4444] px-4 py-[10px] text-sm font-semibold text-white transition-all hover:bg-[#dc2626]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDialogClose(true)}
                className={`cursor-pointer rounded-[10px] border px-4 py-[10px] text-sm font-semibold transition-all ${isDark ? 'border-[#2D2D44] bg-[#0F0F1A] text-white hover:bg-[#2D2D44]' : 'border-[#E5E7EB] bg-[#F6F8FA] text-[#111827] hover:bg-[#E5E7EB]'}`}
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Snackbar */}
          {(snackbar.open || error) && (
            <div className={`fixed bottom-6 left-1/2 z-[1001] flex -translate-x-1/2 items-center gap-4 rounded-xl border px-5 py-3 text-sm font-medium shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${isDark ? 'bg-[#1A1A2E] text-white border-[#2D2D44]' : 'bg-white text-[#111827] border-[#E5E7EB]'} ${(snackbar.severity === 'success' && !error) ? 'border-l-4 border-l-[#22c55e]' : 'border-l-4 border-l-[#ef4444]'}`}>
              <span>{snackbar.open ? snackbar.message : error}</span>
              <button 
                onClick={() => {
                    if(error) setError(null);
                    else handleCloseSnackbar();
                }}
                className={`flex items-center justify-center rounded-full border-0 p-1 ${isDark ? 'text-[#9CA3AF] hover:bg-[#0F0F1A]' : 'text-[#6B7280] hover:bg-[#F6F8FA]'}`}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorAuthComponent;
