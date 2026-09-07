import React, { useState, useEffect, useRef } from 'react'
import { post, resetPasswordApi } from '../api/http'
import { useLocation, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    token: '',
    newPassword: '',
    confirmNewPassword: ''
  })
  
  const [ui, setUi] = useState({
    showPassword: false,
    showConfirmPassword: false,
    loading: false
  })

  const [toast, setToast] = useState(null)
  const isMounted = useRef(true)

  useEffect(() => {
    const stateEmail = location.state?.email || ''
    const stateToken = location.state?.token || ''
    const queryParams = new URLSearchParams(location.search)
    const qEmail = queryParams.get('email') || ''
    const qToken = queryParams.get('token') || ''
    const resolvedEmail = stateEmail || qEmail
    const resolvedToken = stateToken || qToken
    setForm(prev => ({ ...prev, email: resolvedEmail, token: resolvedToken }))
    if ((qEmail || qToken) && (!stateEmail || !stateToken)) {
      navigate('/reset-password', { replace: true, state: { email: resolvedEmail, token: resolvedToken } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirmNewPassword) {
      setToast({ kind: 'error', message: 'Las contraseñas no coinciden' })
      return
    }
    setUi(prev => ({ ...prev, loading: true }))
    try {
      const body = { ...form }
      const res = await post(resetPasswordApi, body)
      if (isMounted.current) {
        setToast({ kind: 'success', message: res?.data?.message || res?.data?.msg })
        setTimeout(() => navigate('/login'), 1500)
      }
    } catch (err) {
      if (isMounted.current) {
        setToast({ kind: 'error', message: err.message })
      }
    } finally {
      if (isMounted.current) setUi(prev => ({ ...prev, loading: false }))
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
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          InputProps={{ sx: inputSx }}
          sx={{ mb: 2 }}
        />
        <TextField
          margin="normal"
          required
          fullWidth
          name="newPassword"
          placeholder="Nueva contraseña"
          type={ui.showPassword ? 'text' : 'password'}
          id="newPassword"
          value={form.newPassword}
          onChange={(e) => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setUi(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  sx={{ color: '#9CA3AF' }}
                >
                  {ui.showPassword ? <VisibilityOff /> : <Visibility />}
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
          type={ui.showConfirmPassword ? 'text' : 'password'}
          id="confirmNewPassword"
          value={form.confirmNewPassword}
          onChange={(e) => setForm(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setUi(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                  sx={{ color: '#9CA3AF' }}
                >
                  {ui.showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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
          disabled={ui.loading}
          className="!mt-6 !mb-4 !text-white !font-semibold"
          style={buttonStyle}
        >
          {ui.loading ? (
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
        toast={toast}
        onClose={() => setToast(null)}
      />
    </AuthLayout>
  )
}
