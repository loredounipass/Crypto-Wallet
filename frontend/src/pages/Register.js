import React from 'react';
import {
  Box,
  Button,
  TextField,
  Grid,
  Link,
  IconButton,
  InputAdornment,
} from '../ui/material';
import { Visibility, VisibilityOff } from '../ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import useAuth from './../hooks/useAuth';
import AuthLayout, { inputSx, buttonStyle } from '../components/AuthLayout';
import TransactionToast from '../components/TransactionToast';

export default function Register() {
  const { registerUser, error } = useAuth();
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  React.useEffect(() => {
    if (error) setOpenSnackbar(true);
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

  return (
    <AuthLayout subtitle="Completa tus datos para registrarte">
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              autoComplete="given-name"
              name="firstName"
              required
              fullWidth
              id="firstName"
              placeholder="Nombre"
              autoFocus
              InputProps={{ sx: inputSx }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="lastName"
              placeholder="Apellidos"
              name="lastName"
              autoComplete="family-name"
              InputProps={{ sx: inputSx }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="email"
              placeholder="Correo electrónico"
              name="email"
              autoComplete="email"
              InputProps={{ sx: inputSx }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="password"
              placeholder="Contraseña"
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
                      sx={{ color: '#9CA3AF' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: inputSx,
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="confirmPassword"
              placeholder="Confirmar contraseña"
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
                      sx={{ color: '#9CA3AF' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: inputSx,
              }}
            />
          </Grid>
        </Grid>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          className="!mt-6 !mb-4 !text-white !font-semibold"
          style={buttonStyle}
        >
          Registrarse
        </Button>
        <Box className="text-center mt-6">
          <span className="text-[#9CA3AF] text-sm">¿Ya tienes una cuenta? </span>
          <Link component={RouterLink} to="/login" className="text-sm font-bold no-underline" sx={{ color: '#6366F1' }}>
            Inicia sesión
          </Link>
        </Box>
      </Box>
      <TransactionToast
        toast={openSnackbar ? { kind: 'error', message: error || 'Las contraseñas no coinciden' } : null}
        onClose={() => setOpenSnackbar(false)}
      />
    </AuthLayout>
  );
}
