import React, { useState, useEffect, useRef, useMemo } from 'react'
import { post, resetPasswordApi } from '../api/http'
import { useLocation, useHistory } from 'react-router-dom'
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
import { ArrowDropDown as ArrowDropDownIcon, Visibility, VisibilityOff } from '../ui/icons';
import { useThemeMode } from '../ui/styles';

function useQuery() {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

export default function ResetPassword() {
  const query = useQuery()
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
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

  useEffect(() => {
    const qEmail = query.get('email') || ''
    const qToken = query.get('token') || ''
    setEmail(qEmail)
    setToken(qToken)
  }, [query])

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

  const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '16px' : '24px',
        backgroundColor: isDark ? '#0F0F1A' : '#F6F8FA',
        boxSizing: 'border-box',
    },
    card: {
        width: '100%',
        maxWidth: '460px',
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
        marginBottom: isMobile ? '14px' : '18px',
        textAlign: 'center',
    },
    input: {
        borderRadius: 12,
        border: `1px solid ${isDark ? '#2D2D44' : '#E5E7EB'}`,
        backgroundColor: isDark ? '#0F0F1A' : '#FFFFFF',
        color: isDark ? '#FFFFFF' : '#111827',
    },
    link: {
        marginTop: '8px',
        fontSize: '0.9rem',
        color: '#2186EB',
        fontWeight: 600,
        textDecoration: 'none',
        cursor: 'pointer',
    },
  };

  return (
    <Box style={styles.page}>
        <Box style={styles.card}>
            <Box component="form" onSubmit={submit} noValidate style={{ width: '100%' }}>
                <Box
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
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
                        Crear nueva contraseña
                    </Typography>
                </Box>

                <TextField
                    margin="normal"
                    fullWidth
                    id="email"
                    label="Correo electrónico"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{ sx: styles.input, readOnly: true }}
                    InputLabelProps={{ shrink: true }}
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
                                    style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                                >
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                        sx: styles.input,
                    }}
                    InputLabelProps={{ shrink: true }}
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
                                    style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}
                                >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                            </InputAdornment>
                        ),
                        sx: styles.input,
                    }}
                    InputLabelProps={{ shrink: true }}
                />

                <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
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
                    {loading ? <CircularProgress size={24} style={{ color: '#FFFFFF' }} /> : 'Restablecer contraseña'}
                </Button>

                <Box style={{ textAlign: 'center', marginTop: '10px' }}>
                    <Link href="/login" style={styles.link}>
                        Volver al inicio de sesión
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
    </Box>
  )
}
