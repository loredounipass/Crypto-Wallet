import React, { useState, useRef, useEffect } from 'react'
import { post, forgotPasswordApi } from '../api/http'
import { useHistory } from 'react-router-dom'
import { Link as RouterLink } from 'react-router-dom'
import {
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Link,
} from '../ui/material';
import AuthLayout, { inputSx, buttonStyle } from '../components/AuthLayout';
import TransactionToast from '../components/TransactionToast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('error')
  const [loading, setLoading] = useState(false)
  const history = useHistory()
  const isMounted = useRef(true)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await post(forgotPasswordApi, { email })
      if (isMounted.current) {
        setSnackbarSeverity('success')
        setSnackbarMessage('Si el correo existe, se ha enviado un mensaje con instrucciones.')
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

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  return (
    <AuthLayout subtitle="Restablecer contraseña">
      <Box component="form" onSubmit={submit} noValidate>
        <Typography className="text-[#9CA3AF] text-xs mb-6 text-center">
          Ingresa tu correo para recibir un enlace
        </Typography>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          placeholder="Correo electrónico"
          name="email"
          type="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          InputProps={{ sx: inputSx }}
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
                Enviando enlace...
              </Typography>
            </Box>
          ) : (
            'Enviar enlace'
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
