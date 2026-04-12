import React, { useState, useRef, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Link,
  Snackbar,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '../ui/material';

import { Visibility as Visibility } from '../ui/icons';
import { VisibilityOff as VisibilityOff } from '../ui/icons';
import { ArrowDropDown as ArrowDropDownIcon } from '../ui/icons';

import { useHistory } from 'react-router-dom';
import useAuth from './../hooks/useAuth';
import { useThemeMode } from '../ui/styles';

export default function Login() {
  const { loginUser, error } = useAuth();
  const history = useHistory();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMounted = useRef(true);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));

    localStorage.setItem('email', data.email);

    setLoading(true);

    try {
      const responseMessage = await loginUser(data);
      if (isMounted.current) {
        if (
          responseMessage &&
          responseMessage.msg === 'Código de verificación enviado a tu correo electrónico.'
        ) {
          history.push('/verifytoken');
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

  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? '16px' : '24px',
      backgroundColor: isDark ? '#0F0F1A' : '#F6F8FA',
      boxSizing: 'border-box',
    },
    card: {
      width: '100%',
      maxWidth: '460px',
      padding: isMobile ? '4px' : '8px',
    },
    title: {
      color: isDark ? '#FFFFFF' : '#111827',
      fontWeight: 700,
      fontSize: isMobile ? '22px' : '26px',
      marginBottom: '2px',
    },
    subtitle: {
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontSize: '13px',
      marginBottom: isMobile ? '14px' : '18px',
    },
    input: {
      borderRadius: 12,
      border: `1px solid ${isDark ? '#2D2D44' : '#E5E7EB'}`,
      backgroundColor: isDark ? '#0F0F1A' : '#FFFFFF',
      color: isDark ? '#FFFFFF' : '#111827',
    },
    link: {
      marginTop: '8px',
      fontSize: '0.9rem',
      color: '#2186EB',
      fontWeight: 600,
      textDecoration: 'none',
    },
  };

  return (
    <Box style={styles.page}>
      <Box style={styles.card}>
        <Box component="form" onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
          <Box
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              marginBottom: '6px',
            }}
          >
            <Box
              style={{
                width: 45,
                height: 50,
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                backgroundColor: '#2186EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowDropDownIcon style={{ color: 'white', fontSize: 40 }} />
            </Box>

            <Typography component="h1" style={styles.title}>
              Iniciar Sesion
            </Typography>
          </Box>

          <Typography style={styles.subtitle}>
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
            error={!!error}
            helperText={error ? error : ''}
            InputProps={{
              sx: styles.input,
            }}
            InputLabelProps={{
              shrink: true,
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
            error={!!error}
            helperText={error ? error : ''}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: styles.input,
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            style={{
              marginTop: '16px',
              marginBottom: '10px',
              color: 'white',
              backgroundColor: '#2186EB',
              borderRadius: '12px',
              padding: isMobile ? '12px 14px' : '14px 16px',
              fontWeight: 600,
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

          <Grid container direction="column" alignItems="center">
            <Grid item>
              <Link
                href="/register"
                variant="body2"
                style={styles.link}
              >
                ¿Aún no tienes cuenta? Regístrate
              </Link>
            </Grid>

            <Grid item>
              <Link
                href="/forgot-password"
                variant="body2"
                style={styles.link}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Grid>
          </Grid>
        </Box>

        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error || 'Ha ocurrido un error al iniciar sesión.'}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
