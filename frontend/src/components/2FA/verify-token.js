import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Link,
} from '../../ui/material';
import AuthLayout, { inputSx, buttonStyle } from '../AuthLayout';
import TransactionToast from '../TransactionToast';

const VerifyToken = () => {
  const [formValues, setFormValues] = useState({ token: '' });
  const { verifyToken, error: authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const history = useHistory();
  const location = useLocation();
  const email = location.state?.email;
  const isMounted = React.useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleChange = (e) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
    setToast(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      setToast({ kind: 'error', message: 'No se encontró el correo electrónico. Por favor, inicia sesión nuevamente.' });
      return;
    }
    if (!formValues.token || formValues.token.trim().length === 0) {
      setToast({ kind: 'error', message: 'Por favor, ingresa el código de verificación.' });
      return;
    }
    if (formValues.token.length < 6) {
      setToast({ kind: 'error', message: 'El código debe tener al menos 6 dígitos.' });
      return;
    }
    setLoading(true);
    setToast(null);
    try {
      const result = await verifyToken({ email, token: formValues.token });
      if (!isMounted.current) return;
      if (result === true) {
        setToast({ kind: 'success', message: '¡Verificación exitosa! Redirigiendo...' });
      } else if (result && (result.msg || result.message)) {
        setToast({ kind: 'success', message: result.message || result.msg });
      } else if (result && result.error) {
        setToast({ kind: 'error', message: result.error });
      } else if (result === false) {
        setToast({ kind: 'error', message: authError || 'Error al verificar el token' });
      }
    } catch (err) {
      if (isMounted.current) {
        setToast({ kind: 'error', message: err.message });
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleResend = () => {
    history.push({ pathname: '/resendtoken', state: { email } });
  };

  return (
    <AuthLayout subtitle="Verificación">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography className="text-[#9CA3AF] text-xs mb-6 text-center">
          Ingresa el token que recibiste en tu correo electrónico
        </Typography>
        <TextField
          margin="normal"
          required
          fullWidth
          id="token"
          placeholder="Token"
          name="token"
          autoFocus
          value={formValues.token}
          onChange={handleChange}
          InputProps={{ sx: inputSx }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          className="!mt-6 !mb-4 !text-white !font-semibold"
          style={buttonStyle}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <CircularProgress size={20} sx={{ color: '#FFFFFF' }} />
              <Typography sx={{ ml: 1, color: '#FFFFFF', fontSize: 16, fontWeight: 600 }}>
                Verificando...
              </Typography>
            </Box>
          ) : (
            'Verificar'
          )}
        </Button>
        <Box className="text-center mt-6">
          <Link onClick={handleResend} className="text-sm font-bold no-underline cursor-pointer" sx={{ color: '#6366F1' }}>
            Reenviar Token
          </Link>
        </Box>
      </Box>
      <TransactionToast toast={toast} onClose={() => setToast(null)} />
    </AuthLayout>
  );
};

export default VerifyToken;
