import React, { useState, useRef, useEffect } from 'react'
import { post, forgotPasswordApi } from '../api/http'
import { useHistory } from 'react-router-dom'
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
import { ArrowDropDown as ArrowDropDownIcon } from '../ui/icons';
import { useThemeMode } from '../ui/styles';

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
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';

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
                        Restablecer contraseña
                    </Typography>
                </Box>

                <Typography style={styles.subtitle}>
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
                    InputProps={{ sx: styles.input }}
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
                    {loading ? <CircularProgress size={24} style={{ color: '#FFFFFF' }} /> : 'Enviar enlace'}
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
