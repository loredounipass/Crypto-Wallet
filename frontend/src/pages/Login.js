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
} from '../ui/material';

import { Visibility as Visibility } from '../ui/icons';
import { VisibilityOff as VisibilityOff } from '../ui/icons';
import { ArrowDropDown as ArrowDropDownIcon } from '../ui/icons';

import { useHistory } from 'react-router-dom';
import useAuth from './../hooks/useAuth';

export default function Login() {
  const { loginUser, error } = useAuth();
  const history = useHistory();

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

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '480px',
          mt: 0,
          px: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* CAMBIO: el logo ahora va DENTRO del form para quedar centrado en el formulario */}
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%', mt: 0 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 45,
                height: 50,
                clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                bgcolor: '#2186EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowDropDownIcon sx={{ color: 'white', fontSize: 40 }} />
            </Box>

            <Typography component="h1" variant="h5" sx={{ fontWeight: 502 }}>
              Login now
            </Typography>
          </Box>

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
              sx: {
                borderRadius: 2,
                border: '1px solid #ddd',
              },
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
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                border: '1px solid #ddd',
              },
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              color: 'white',
              bgcolor: '#326DEB',
              '&:hover': {
                bgcolor: '#326DEB',
              },
            }}
            disabled={loading}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ color: '#074EE7FF' }} />
                <Typography sx={{ ml: 1, color: '#074EE7FF', fontSize: '0.875rem' }}>
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
                sx={{
                  mt: 2,
                  fontSize: '0.9rem',
                  color: '#1E5BB5',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textTransform: 'none',
                  letterSpacing: '0.2px',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#163f7a',
                  },
                }}
              >
                ¿Aún no tienes cuenta? Regístrate
              </Link>
            </Grid>

            <Grid item>
              <Link
                href="/forgot-password"
                variant="body2"
                sx={{
                  mt: 1,
                  fontSize: '0.9rem',
                  color: '#1E5BB5',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textTransform: 'none',
                  letterSpacing: '0.2px',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#163f7a',
                  },
                }}
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