import React, { useState } from 'react';
import useAuth from '../../hooks/useAuth';
import { useHistory, useLocation } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
} from '../../ui/material';
import AuthLayout, { inputSx, buttonStyle } from '../AuthLayout';

const ResendTokenForm = () => {
  const { resendToken, error, successMessage } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const [email, setEmail] = useState(() => location.state?.email || '');
  const [loading, setLoading] = useState(false);



  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const res = await resendToken({ email: email.trim() });
      if (res?.success && res.message.includes('código de verificación')) {
        history.push({ pathname: '/verifytoken', state: { email } });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout subtitle="Reenviar código de verificación">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography className="text-[#9CA3AF] text-xs mb-6 text-center">
          Ingresa tu correo para reenviar el código
        </Typography>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          placeholder="Correo electrónico"
          name="email"
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
                Reenviando...
              </Typography>
            </Box>
          ) : (
            'Reenviar Código'
          )}
        </Button>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          {error && <Typography color="error" variant="body2">{error}</Typography>}
          {successMessage && <Typography sx={{ color: '#7fffd4' }} variant="body2">{successMessage}</Typography>}
        </Box>
      </Box>
    </AuthLayout>
  );
};

export default ResendTokenForm;
