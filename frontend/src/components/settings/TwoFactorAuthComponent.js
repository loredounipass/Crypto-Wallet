import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import User from '../../services/user';
import useAuth from '../../hooks/useAuth';
import {
  Switch,
  FormControlLabel,
  Typography,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Paper,
  Snackbar
} from '../../ui/material';
import { CheckCircle as CheckCircleIcon } from '../../ui/icons';
import { Warning as WarningIcon } from '../../ui/icons';
import { Alert as MuiAlert } from '../../ui/material';

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
      if (!auth) {
        setLoading(false);
        return;
      }
      try {
        const response = await User.getTokenStatus({ signal: controller.signal });
        // backend may return { isTokenEnabled } or { data: { isTokenEnabled } }
        const tokenStatus = response?.data?.isTokenEnabled ?? response?.data?.data?.isTokenEnabled;
        setIsTokenEnabled(Boolean(tokenStatus));
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
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
    // Optimistically update UI
    setIsTokenEnabled(newStatus);
    setShowWarning(!newStatus);
    setLoading(true);
    try {
      const res = await updateTokenStatus({ email: auth.email, isTokenEnabled: newStatus });
      setSnackbar({ open: true, message: newStatus ? 'Autenticación de dos factores activada.' : 'Autenticación de dos factores desactivada.', severity: 'success' });
      return res;
    } catch (err) {
      // Revert optimistic change on error
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

  return (
    <Paper elevation={3} sx={{ padding: 3, borderRadius: 2, maxWidth: 400, margin: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        2FA Auth
      </Typography>
      <FormControlLabel
        control={<Switch checked={isTokenEnabled} onChange={toggleTwoFactorAuth} color="primary" disabled={loading} />}
        label={
          isTokenEnabled
            ? <span style={{ display: 'flex', alignItems: 'center' }}>
                Desactivar <CheckCircleIcon style={{ color: 'green', marginLeft: 4, fontSize: '1.2rem' }} />
              </span>
            : 'Activar'
        }
      />
      {isTokenEnabled && <Typography variant="body2" style={{ color: 'green' }}>La autenticación de dos factores está activa.</Typography>}
      {showWarning && (
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'red', marginBottom: 1 }}>
          <WarningIcon sx={{ marginRight: 1 }} />
          <Typography variant="body2">Desactivar la autenticación de dos factores pone en riesgo tu cuenta.</Typography>
        </Box>
      )}

      <Dialog open={confirmDialogOpen} onClose={() => handleConfirmDialogClose(false)} PaperProps={{ sx: { margin: 'auto' } }}>
        <DialogTitle>Confirmar Desactivación</DialogTitle>
        <DialogContent>
          <Typography>¿Estás seguro de que deseas desactivar la autenticación de dos factores? Esto pone en riesgo tu cuenta a cibercriminales.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmDialogClose(false)} color="error" variant="contained">Cancelar</Button>
          <Button onClick={() => handleConfirmDialogClose(true)} color="primary" variant="contained">Desactivar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</MuiAlert>
      </Snackbar>

      {error && (
        <Snackbar open={true} autoHideDuration={6000} onClose={() => setError(null)}>
          <MuiAlert elevation={6} variant="filled" onClose={() => setError(null)} severity="error">{error}</MuiAlert>
        </Snackbar>
      )}
    </Paper>
  );
};

export default TwoFactorAuthComponent;
