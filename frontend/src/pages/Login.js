import React, { useState, useRef, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  TextField,
  Link,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '../ui/material';

import { Visibility, VisibilityOff } from '../ui/icons';

import { useHistory } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from './../hooks/useAuth';

import Logo from '../components/Logo';

export default function Login() {
  const { loginUser, error } = useAuth();
  const history = useHistory();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

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
      if (isMounted.current) {
        if (
          responseMessage &&
          responseMessage.msg === 'Código de verificación enviado a tu correo electrónico.'
        ) {
          history.push({ pathname: '/verifytoken', state: { email: data.email } });
        } else if (responseMessage && responseMessage.msg === 'Logged in!') {
          history.push('/');
        } else {
          setOpenSnackbar(true);
        }
      }
    } catch (e) {
      if (isMounted.current) setOpenSnackbar(true);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

   return (
      <Box className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#F6F8FA] dark:bg-[#0F0F1A] box-border">
        <Box component="form" onSubmit={handleSubmit} noValidate className="w-full max-w-[360px]">
          <Logo />

          <Typography className="text-[#6B7280] dark:text-[#9CA3AF] text-xs mb-6 mt-2 text-center">
            Accede con tu correo y contrasena
          </Typography>

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            InputProps={{
              sx: {
                borderRadius: 12,
                border: '1px solid rgba(99, 102, 241, 0.3)',
                backgroundColor: 'rgba(15, 15, 26, 0.8)',
                color: '#FFFFFF',
                backdropFilter: 'blur(10px)',
              },
            }}
            InputLabelProps={{
              shrink: true,
              style: { color: '#A5B4FC' },
            }}
            sx={{
              '& label': { color: '#A5B4FC' },
              '& label.Mui-focused': { color: '#818CF8' },
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Contraseña"
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
                    style={{ color: '#9CA3AF' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 12,
                border: '1px solid rgba(99, 102, 241, 0.3)',
                backgroundColor: 'rgba(15, 15, 26, 0.8)',
                color: '#FFFFFF',
                backdropFilter: 'blur(10px)',
              },
            }}
            InputLabelProps={{
              shrink: true,
              style: { color: '#A5B4FC' },
            }}
            sx={{
              '& label': { color: '#A5B4FC' },
              '& label.Mui-focused': { color: '#818CF8' },
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="!mt-6 !mb-4 !text-white !font-semibold"
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
            }}
            disabled={loading}
          >
            {loading ? (
              <Box style={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} style={{ color: '#FFFFFF' }} />
                <Typography style={{ marginLeft: '8px', color: '#FFFFFF', fontSize: '0.875rem' }}>
                  Iniciando sesión...
                </Typography>
              </Box>
            ) : (
              'Iniciar sesión'
            )}
          </Button>

          <Box className="mt-8 space-y-3 text-center">
            <Box className="text-sm">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">¿Aún no tienes cuenta? </span>
              <Link
                component={RouterLink}
                to="/register"
                className="font-bold no-underline"
                style={{ color: '#6366F1' }}
              >
                Regístrate
              </Link>
            </Box>

            <Box className="text-sm">
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">¿Olvidaste tu </span>
              <Link
                component={RouterLink}
                to="/forgot-password"
                className="font-bold no-underline"
                style={{ color: '#8B5CF6' }}
              >
                contraseña
              </Link>
              <span className="text-[#6B7280] dark:text-[#9CA3AF]">?</span>
            </Box>
          </Box>
        </Box>

        <Snackbar 
          open={openSnackbar} 
          autoHideDuration={6000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error || 'Ha ocurrido un error al iniciar sesión.'}
          </Alert>
        </Snackbar>
      </Box>
    );
}
