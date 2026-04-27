import React from 'react';
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
import { Visibility, VisibilityOff } from '../ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from './../hooks/useAuth';
import Logo from '../components/Logo';

export default function Register() {
  const { registerUser, error } = useAuth();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  React.useEffect(() => {
    if (error) {
      setOpenSnackbar(true);
    }
  }, [error]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setOpenSnackbar(true);
      return;
    }

    const data = Object.fromEntries(new FormData(event.currentTarget));
    await registerUser(data);
  };

  const handleCloseSnackbar = () => setOpenSnackbar(false);

  const inputSx = {
    borderRadius: 12,
    border: '1px solid rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(15, 15, 26, 0.8)',
    color: '#FFFFFF',
    backdropFilter: 'blur(10px)',
  };

  const labelSx = {
    '& label': { color: '#A5B4FC' },
    '& label.Mui-focused': { color: '#818CF8' },
  };

  return (
    <Box className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 w-full bg-[#0F0F1A] box-border">
      <Box className="w-full max-w-[360px]" component="form" noValidate onSubmit={handleSubmit}>
        <Logo />

        <Typography className="text-[#9CA3AF] text-xs mb-6 mt-2 text-center">
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
              InputProps={{ sx: inputSx }}
              InputLabelProps={{
                shrink: true,
                style: { color: '#A5B4FC' },
              }}
              sx={labelSx}
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
              InputProps={{ sx: inputSx }}
              InputLabelProps={{
                shrink: true,
                style: { color: '#A5B4FC' },
              }}
              sx={labelSx}
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
              InputProps={{ sx: inputSx }}
              InputLabelProps={{
                shrink: true,
                style: { color: '#A5B4FC' },
              }}
              sx={labelSx}
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
                sx: inputSx,
              }}
              InputLabelProps={{
                shrink: true,
                style: { color: '#A5B4FC' },
              }}
              sx={labelSx}
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
                      type="button"
                      edge="end"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ color: '#9CA3AF' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: inputSx,
              }}
              InputLabelProps={{
                shrink: true,
                style: { color: '#A5B4FC' },
              }}
              sx={labelSx}
            />
          </Grid>
        </Grid>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          className="!mt-6 !mb-4 !text-white !font-semibold"
          style={{
            padding: isMobile ? '12px 14px' : '14px 16px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)',
            boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
          }}
        >
          Registrarse
        </Button>

        <Box className="text-center mt-6">
          <span className="text-[#9CA3AF] text-sm">¿Ya tienes una cuenta? </span>
          <Link
            component={RouterLink}
            to="/login"
            className="text-sm font-bold no-underline"
            style={{ color: '#6366F1' }}
          >
            Inicia sesión
          </Link>
        </Box>
      </Box>

      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error || 'Ha ocurrido un error al registrarse.'}
        </Alert>
      </Snackbar>
    </Box>
  );
}
