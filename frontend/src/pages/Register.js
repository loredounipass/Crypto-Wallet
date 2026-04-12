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
} from '../ui/material';
import { Visibility as Visibility } from '../ui/icons';
import { VisibilityOff as VisibilityOff } from '../ui/icons';
import useAuth from './../hooks/useAuth';

export default function Register() {
  const { registerUser, error } = useAuth();

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

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start', // CAMBIO: pega el contenido arriba
        alignItems: 'center',
        width: '100%',
        overflowY: 'hidden',
        pt: 0, // CAMBIO: sin padding-top para que suba
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '480px',
          px: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: 0, // CAMBIO: sin margen arriba
        }}
      >
        {/* CAMBIO: logo centrado DENTRO del form */}
        <Box sx={{ width: '100%', mt: 0 }} component="form" noValidate onSubmit={handleSubmit}>
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
              Register now
            </Typography>
          </Box>

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
                  sx: { borderRadius: 2, border: '1px solid #ddd' },
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
                  sx: { borderRadius: 2, border: '1px solid #ddd' },
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
                  sx: { borderRadius: 2, border: '1px solid #ddd' },
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
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, border: '1px solid #ddd' },
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
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2, border: '1px solid #ddd' },
                }}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              color: 'white',
              bgcolor: '#326DEB',
              '&:hover': { bgcolor: '#326DEB' },
            }}
          >
            Registrarse
          </Button>

          <Grid container justifyContent="center">
            <Grid item>
              <Link
                href="/login"
                variant="body2"
                sx={{
                  mt: 2,
                  fontSize: '0.875rem',
                  color: '#326DEB',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: '#1E5BB5',
                  },
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