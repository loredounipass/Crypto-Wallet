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
  useTheme,
  useMediaQuery,
  Link,
} from '../ui/material';

import Logo from '../components/Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('error')
  const [loading, setLoading] = useState(false)
  const history = useHistory()
  const isMounted = useRef(true)

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

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
        setSnackbarMessage(err?.response?.data?.message || 'Error al enviar el correo')
        setOpenSnackbar(true)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

     return (
       <Box className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#F6F8FA] dark:bg-[#0F0F1A] box-border">
           <Box component="form" onSubmit={submit} noValidate className="w-full max-w-[360px]">
              <Logo />

              <Typography className="text-[#6B7280] dark:text-[#9CA3AF] text-xs mb-2 mt-2 text-center">
                Restablecer contraseña
              </Typography>

               <Typography className="text-[#6B7280] dark:text-[#9CA3AF] text-xs mb-6 text-center">
                   Ingresa tu correo para recibir un enlace
               </Typography>

              <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Correo electrónico"
                  name="email"
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

               <Button
                   type="submit"
                   fullWidth
                   variant="contained"
                   disabled={loading}
                   className="!mt-6 !mb-4 !text-white !font-semibold"
                   style={{
                       padding: isMobile ? '12px 14px' : '14px 16px',
                       borderRadius: '12px',
                       background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #2186EB 100%)',
                       boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                   }}
               >
                   {loading ? <CircularProgress size={24} style={{ color: '#FFFFFF' }} /> : 'Enviar enlace'}
               </Button>

               <Box className="text-center mt-6">
                 <span className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">¿Ya tienes una cuenta? </span>
                 <Link
                   component={RouterLink}
                   to="/login"
                   className="text-sm font-bold no-underline"
                   style={{ color: '#6366F1' }}
                 >
                   Inicia sesión
                 </Link>
               </Box>

              {openSnackbar && (
                  <Box style={{ textAlign: 'center', marginTop: '10px' }}>
                      <Typography style={{ color: snackbarSeverity === 'success' ? '#7fffd4' : '#ff7b7b' }} variant="body2">
                          {snackbarMessage}
                      </Typography>
                  </Box>
              )}
          </Box>
      </Box>
    )
}
