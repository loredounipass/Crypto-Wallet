import React, { useState, useRef, useEffect } from 'react'
import {
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Link,
  Snackbar,
  Alert,
  CircularProgress,
} from '../ui/material'
import { ArrowDropDown as ArrowDropDownIcon } from '../ui/icons';
import { post, forgotPasswordApi } from '../api/http'
import { useHistory } from 'react-router-dom'

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
        setSnackbarMessage(err?.response?.data?.message || 'Error al enviar el correo')
        setOpenSnackbar(true)
      }
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

  const handleCloseSnackbar = () => setOpenSnackbar(false)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '480px',
          mt: 0,
          px: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box component="form" onSubmit={submit} noValidate sx={{ width: '100%', mt: 0 }}>
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
              Restablecer contraseña
            </Typography>
          </Box>

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Correo electrónico"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              sx: {
                borderRadius: 2,
                border: '1px solid #ddd',
              },
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              color: 'white',
              bgcolor: '#326DEB',
              '&:hover': {
                bgcolor: '#326DEB',
              },
            }}
            disabled={loading}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={20} sx={{ color: '#074EE7FF' }} />
                <Typography sx={{ ml: 1, color: '#074EE7FF', fontSize: '0.875rem' }}>
                  Enviando...
                </Typography>
              </Box>
            ) : (
              'Enviar enlace de restablecimiento'
            )}
          </Button>

          <Grid container direction="column" alignItems="center">
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
                Volver al inicio de sesión
              </Link>
            </Grid>
          </Grid>
        </Box>

        <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  )
}
