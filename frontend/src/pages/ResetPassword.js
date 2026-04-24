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
  useTheme,
  useMediaQuery,
  Link,
  InputAdornment,
  IconButton,
} from '../ui/material';
import { Visibility, VisibilityOff } from '../ui/icons';
import Logo from '../components/Logo';

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

  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("sm"));

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
    return () => {
      isMounted.current = false
    }
  }, [])

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
        setSnackbarMessage(res?.data?.message || 'Contraseña restablecida con éxito')
        setOpenSnackbar(true)
        setTimeout(() => history.push('/login'), 1500)
      }
    } catch (err) {
      if (isMounted.current) {
        setSnackbarSeverity('error')
        setSnackbarMessage(err?.response?.data?.message || 'Error al restablecer la contraseña')
        setOpenSnackbar(true)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

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
    <Box className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#0F0F1A] box-border">
        <Box component="form" onSubmit={submit} noValidate className="w-full max-w-[360px]">
            <Logo />

            <Typography className="text-[#9CA3AF] text-xs mb-6 mt-2 text-center">
              Crear nueva contraseña
            </Typography>

            <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Correo electrónico"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{ sx: inputSx }}
                InputLabelProps={{
                  shrink: true,
                  style: { color: '#A5B4FC' },
                }}
                sx={labelSx}
            />

            <TextField
                margin="normal"
                required
                fullWidth
                id="token"
                label="Token de recuperación"
                name="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                InputProps={{ sx: inputSx }}
                InputLabelProps={{
                  shrink: true,
                  style: { color: '#A5B4FC' },
                }}
                sx={labelSx}
            />

            <TextField
                margin="normal"
                required
                fullWidth
                name="newPassword"
                label="Nueva contraseña"
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

            <TextField
                margin="normal"
                required
                fullWidth
                name="confirmNewPassword"
                label="Confirmar contraseña"
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
                 {loading ? <CircularProgress size={24} style={{ color: '#FFFFFF' }} /> : 'Restablecer contraseña'}
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
