import React, { useState, useRef, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  TextField,
  Link,
  IconButton,
  InputAdornment,
  CircularProgress,
} from '../ui/material';
import { Visibility, VisibilityOff } from '../ui/icons';
import { useNavigate } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from './../hooks/useAuth';
import AuthLayout, { inputSx, buttonStyle } from '../components/AuthLayout';
import TransactionToast from '../components/TransactionToast';

export default function Login() {
  const { loginUser, error } = useAuth();
  const navigate = useNavigate();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setLoading(true);
    try {
      const responseMessage = await loginUser(data);
      if (!isMounted.current) return;
      if (responseMessage?.requires2FA) {
        navigate('/verifytoken', { state: { email: data.email } });
      } else if (responseMessage?.msg === 'Logged in!' || responseMessage?.message === 'Logged in!') {
        navigate('/');
      } else {
        setOpenSnackbar(true);
      }
    } catch (e) {
      if (isMounted.current) setOpenSnackbar(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (openSnackbar) {
      const timer = setTimeout(() => setOpenSnackbar(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [openSnackbar]);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  return (
    <AuthLayout subtitle="Accede con tu correo y contrasena">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          placeholder="Correo electrónico"
          name="email"
          autoComplete="email"
          autoFocus
          InputProps={{ sx: inputSx }}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="password"
          placeholder="Contraseña"
          type={showPassword ? 'text' : 'password'}
          id="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  type="button"
                  edge="end"
                  onClick={() => setShowPassword(!showPassword)}
                  sx={{ color: '#9CA3AF' }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
            sx: inputSx,
          }}
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
                Iniciando sesión...
              </Typography>
            </Box>
          ) : (
            'Iniciar sesión'
          )}
        </Button>
        <Box className="mt-8 space-y-3 text-center">
          <Box className="text-sm">
            <span className="text-[#9CA3AF]">¿Aún no tienes cuenta? </span>
            <Link component={RouterLink} to="/register" className="font-bold no-underline" sx={{ color: '#6366F1' }}>
              Regístrate
            </Link>
          </Box>
          <Box className="text-sm">
            <span className="text-[#9CA3AF]">¿Olvidaste tu </span>
            <Link component={RouterLink} to="/forgot-password" className="font-bold no-underline" sx={{ color: '#8B5CF6' }}>
              contraseña
            </Link>
            <span className="text-[#9CA3AF]">?</span>
          </Box>
        </Box>
      </Box>
      <TransactionToast
        toast={openSnackbar ? { kind: 'error', message: error || 'Error al iniciar sesión' } : null}
        onClose={() => setOpenSnackbar(false)}
      />
    </AuthLayout>
  );
}
