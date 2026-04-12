import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import User from '../../services/user';
import useAuth from '../../hooks/useAuth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import CloseIcon from '@mui/icons-material/Close';

const TwoFactorAuthComponent = () => {
  const { auth } = useContext(AuthContext);
  const { updateTokenStatus } = useAuth();

  const [isTokenEnabled, setIsTokenEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTokenStatus = async () => {
      console.log('[2FA] fetchTokenStatus called, auth:', auth ? `User: ${auth.firstName}` : 'null');
      if (!auth) {
        console.log('[2FA] No auth, skipping fetch');
        setLoading(false);
        return;
      }
      try {
        console.log('[2FA] Fetching token status from API...');
        const response = await User.getTokenStatus({ signal: controller.signal });
        console.log('[2FA] Raw API response:', JSON.stringify(response?.data, null, 2));
        
        // Handle both { isTokenEnabled: boolean } and { data: { isTokenEnabled: boolean } }
        const tokenStatus = response?.data?.isTokenEnabled ?? response?.data?.data?.isTokenEnabled;
        console.log('[2FA] Parsed tokenStatus:', tokenStatus, '→ Boolean:', Boolean(tokenStatus));
        setIsTokenEnabled(Boolean(tokenStatus));
      } catch (err) {
        // Ignore cancellation errors - these are expected when component unmounts
        const isCanceled = err.name === 'CanceledError' || 
                          err.name === 'AbortError' || 
                          err.code === 'ERR_CANCELED' ||
                          err.message?.includes('canceled');
        if (!isCanceled) {
          console.error('[2FA] Error fetching token status:', err);
          console.error('[2FA] Error response data:', err.response?.data);
          console.error('[2FA] Error status:', err.response?.status);
          setError(err.message || 'Error fetching token status');
        } else {
          console.log('[2FA] Fetch canceled (component unmounted)');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTokenStatus();
    return () => controller.abort();
  }, [auth]);

  const toggleTwoFactorAuth = () => {
    console.log('[2FA] Toggle clicked! Current isTokenEnabled:', isTokenEnabled);
    if (isTokenEnabled) {
      console.log('[2FA] Currently enabled → showing warning dialog');
      setShowWarning(true);
      setConfirmDialogOpen(true);
    } else {
      console.log('[2FA] Currently disabled → enabling 2FA');
      updateTokenStatusOnly(true);
    }
  };
  const updateTokenStatusOnly = async (newStatus) => {
    const previousStatus = isTokenEnabled;
    console.log('[2FA] updateTokenStatusOnly called:', { newStatus, previousStatus });
    setIsTokenEnabled(newStatus);
    setShowWarning(!newStatus);
    setLoading(true);
    try {
      console.log('[2FA] Calling updateTokenStatus API with:', newStatus);
      const res = await updateTokenStatus({ isTokenEnabled: newStatus });
      console.log('[2FA] updateTokenStatus API response:', JSON.stringify(res, null, 2));
      setSnackbar({ 
        open: true, 
        message: newStatus ? 'Autenticación de dos factores activada.' : 'Autenticación de dos factores desactivada.', 
        severity: 'success' 
      });
      return res;
    } catch (err) {
      console.error('[2FA] Error updating token status:', err);
      console.error('[2FA] Error response data:', err.response?.data);
      console.error('[2FA] Error status:', err.response?.status);
      setIsTokenEnabled(previousStatus);
      setShowWarning(!previousStatus);
      setError(err?.message || 'No se pudo actualizar el estado.');
      return null;
    } finally {
      console.log('[2FA] updateTokenStatusOnly finished, loading → false');
      setLoading(false);
    }
  };

  const handleConfirmDialogClose = (confirm) => {
    console.log('[2FA] Confirm dialog closed, confirm:', confirm);
    setConfirmDialogOpen(false);
    if (confirm) {
      console.log('[2FA] User confirmed → disabling 2FA');
      updateTokenStatusOnly(false);
    } else {
      console.log('[2FA] User canceled → keeping current state');
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
      className={`settings-switch-btn ${checked ? 'active' : 'inactive'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`settings-switch-thumb ${checked ? 'active' : 'inactive'}`}
      />
    </button>
  );

  return (
    <div className="settings-section-wrapper">
      <div className="settings-form-card">
        <div className="settings-section-header">
          <div className="settings-large-icon">
            <CheckCircleIcon className="settings-large-icon-inner" />
          </div>
          <h2 className="settings-title">2FA Auth</h2>
        </div>

        <div className="settings-2fa-container">
          <div className="settings-2fa-row">
        <div className="settings-2fa-status">
          <span style={{ marginRight: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
            {isTokenEnabled ? 'Desactivar' : 'Activar'}
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
        <p style={{ fontSize: '0.875rem', color: 'var(--settings-success)', marginBottom: '1rem' }}>
          La autenticación de dos factores está activa.
        </p>
      )}

      {showWarning && (
        <div className="settings-alert settings-alert-error">
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <WarningIcon style={{ color: 'var(--settings-danger)', marginRight: '0.5rem' }} fontSize="small" />
            <span>Desactivar la autenticación de dos factores pone en riesgo tu cuenta.</span>
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {confirmDialogOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Confirmar Desactivación</h3>
            <p className="modal-text">
              ¿Estás seguro de que deseas desactivar la autenticación de dos factores? Esto pone en riesgo tu cuenta a cibercriminales.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => handleConfirmDialogClose(false)}
                className="btn-danger"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDialogClose(true)}
                className="btn-secondary"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Snackbar */}
          {(snackbar.open || error) && (
            <div className={`custom-snackbar ${snackbar.severity === 'success' ? 'success' : 'error'} ${error ? 'error' : ''}`}>
              <span>{snackbar.open ? snackbar.message : error}</span>
              <button 
                onClick={() => {
                    if(error) setError(null);
                    else handleCloseSnackbar();
                }}
                className="snackbar-close"
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
