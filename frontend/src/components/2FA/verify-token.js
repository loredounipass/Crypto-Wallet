import React from 'react';
import {
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Link,
} from '../../ui/material';
import AuthLayout, { inputSx, buttonStyle } from '../AuthLayout';
import { TransactionToast } from '../toasts/Toast';
import useVerifyTokenLogic from './useVerifyTokenLogic';

const VerifyToken = () => {
  const {
    formValues,
    loading,
    toast,
    setToast,
    handleChange,
    handleSubmit,
    handleResend
  } = useVerifyTokenLogic();

  return (
    <AuthLayout subtitle="Verificación">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography className="text-[#9CA3AF] text-xs mb-6 text-center" style={{ opacity: 0.8 }}>
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
          <Link onClick={handleResend} className="text-sm font-bold no-underline cursor-pointer" sx={{ color: '#A78BFA', transition: 'all 0.3s', '&:hover': { color: '#C4B5FD', textShadow: '0 0 10px rgba(196, 181, 253, 0.6)' } }}>
            Reenviar Token
          </Link>
        </Box>
      </Box>
      <TransactionToast toast={toast} onClose={() => setToast(null)} />
    </AuthLayout>
  );
};

export default VerifyToken;
