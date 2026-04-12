import React from 'react';
import { ArrowDropDown as ArrowDropDownIcon } from '../ui/icons';
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
  useTheme,
  useMediaQuery,
} from '../ui/material';
import { Visibility as Visibility } from '../ui/icons';
import { VisibilityOff as VisibilityOff } from '../ui/icons';
import useAuth from './../hooks/useAuth';
import { useThemeMode } from '../ui/styles';

export default function Register() {
  const { registerUser, error } = useAuth();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setOpenSnackbar(true);
      return;
    }

    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await registerUser(data);
    } catch (e) {
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const styles = {
    page: {
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      padding: isMobile ? '16px' : '24px',
      backgroundColor: isDark ? '#0F0F1A' : '#F6F8FA',
      boxSizing: 'border-box',
    },
    card: {
      width: '100%',
      maxWidth: '520px',
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
      marginBottom: isMobile ? '12px' : '16px',
      textAlign: 'center',
    },
    input: {
      borderRadius: 12,
      border: `1px solid ${isDark ? '#2D2D44' : '#E5E7EB'}`,
      backgroundColor: isDark ? '#0F0F1A' : '#FFFFFF',
      color: isDark ? '#FFFFFF' : '#111827',
    },
  };

  return (
    <Box style={styles.page}>
      <Box style={styles.card}>
        <Box style={{ width: '100%' }} component="form" noValidate onSubmit={handleSubmit}>
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
              Crear Cuenta
            </Typography>
          </Box>

          <Typography style={styles.subtitle}>
            Completa tus datos para registrarte
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoComplete="given-name"
                name="firstName"
                required
                fullWidth
                id="firstName"
                label="Nombre"
                autoFocus
                error={!!error}
                helperText={error ? error : ''}
                InputProps={{
                  sx: styles.input,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="lastName"
                label="Apellidos"
                name="lastName"
                autoComplete="family-name"
                error={!!error}
                helperText={error ? error : ''}
                InputProps={{
                  sx: styles.input,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                id="email"
                label="Correo electrónico"
                name="email"
                autoComplete="email"
                error={!!error}
                helperText={error ? error : ''}
                InputProps={{
                  sx: styles.input,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="password"
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
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
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirmar contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={password !== confirmPassword}
                helperText={password !== confirmPassword ? 'Las contraseñas no coinciden' : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: styles.input,
                }}
              />
            </Grid>
          </Grid>

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
          >
            Registrarse
          </Button>

          <Grid container justifyContent="center">
            <Grid item>
              <Link
                href="/login"
                variant="body2"
                style={{
                  marginTop: '8px',
                  display: 'inline-block',
                  fontSize: '0.9rem',
                  color: '#2186EB',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                ¿Ya tienes una cuenta? Inicia sesión
              </Link>
            </Grid>
          </Grid>
        </Box>

        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error || 'Ha ocurrido un error al registrarse.'}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
