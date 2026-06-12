import React, { useState, useEffect, useRef } from 'react'
import { post, resetPasswordApi } from '../api/http'
import { useLocation, useHistory } from 'react-router-dom'
import { Link as RouterLink } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
} from '../ui/material';
import { Visibility, VisibilityOff } from '../ui/icons';
import AuthLayout, { inputSx, buttonStyle } from '../components/AuthLayout';
import TransactionToast from '../components/TransactionToast';

export default function ResetPassword() {
  const location = useLocation()
  const history = useHistory()
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('error')
  const [loading, setLoading] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    const stateEmail = location.state?.email || ''
    const stateToken = location.state?.token || ''
    const queryParams = new URLSearchParams(location.search)
    const qEmail = queryParams.get('email') || ''
    const qToken = queryParams.get('token') || ''
    const resolvedEmail = stateEmail || qEmail
    const resolvedToken = stateToken || qToken
    setEmail(resolvedEmail)
    setToken(resolvedToken)
    if ((qEmail || qToken) && (!stateEmail || !stateToken)) {
      history.replace({
        pathname: '/reset-password',
        state: { email: resolvedEmail, token: resolvedToken },
      })
    }
  }, [location.search, location.state, history])

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmNewPassword) {
      setSnackbarSeverity('error')
      setSnackbarMessage('Las contraseñas no coinciden')
      setOpenSnackbar(true)
      return
    }
    setLoading(true)
    try {
      const body = { email, token, newPassword, confirmNewPassword }
      const res = await post(resetPasswordApi, body)
      if (isMounted.current) {
        setSnackbarSeverity('success')
        setSnackbarMessage(res?.data?.message || res?.data?.msg)
        setOpenSnackbar(true)
        setTimeout(() => history.push('/login'), 1500)
      }
    } catch (err) {
      if (isMounted.current) {
        setSnackbarSeverity('error')
        setSnackbarMessage(err.message)
        setOpenSnackbar(true)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

  return (
    <AuthLayout subtitle="Crear nueva contraseña">
      <Box component="form" onSubmit={submit} noValidate>
        <TextField
          margin="normal"
          fullWidth
          id="email"
          placeholder="Correo electrónico"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{ sx: inputSx }}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="newPassword"
          placeholder="Nueva contraseña"
          type={showPassword ? 'text' : 'password'}
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  sx={{ color: '#9CA3AF' }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
            sx: inputSx,
          }}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="confirmNewPassword"
          placeholder="Confirmar contraseña"
          type={showConfirmPassword ? 'text' : 'password'}
          id="confirmNewPassword"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
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
                Restableciendo...
              </Typography>
            </Box>
          ) : (
            'Restablecer contraseña'
          )}
        </Button>
        <Box className="text-center mt-6">
          <span className="text-[#9CA3AF] text-sm">¿Ya tienes una cuenta? </span>
          <Link component={RouterLink} to="/login" className="text-sm font-bold no-underline" sx={{ color: '#6366F1' }}>
            Inicia sesión
          </Link>
        </Box>
      </Box>
      <TransactionToast
        toast={openSnackbar ? { kind: snackbarSeverity, message: snackbarMessage } : null}
        onClose={() => setOpenSnackbar(false)}
      />
    </AuthLayout>
  )
}
