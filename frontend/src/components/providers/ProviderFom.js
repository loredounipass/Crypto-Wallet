import React, { useState, useContext, useEffect } from 'react';
import { useHistory } from 'react-router-dom'; 
import {
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from '../../ui/material';
import useProvider from '../../hooks/useProviders';
import { AuthContext } from '../../hooks/AuthContext';


export default function ProviderForm() {
  const { createNewProvider, findByEMail, provider, error } = useProvider();
  const { auth } = useContext(AuthContext);
  const history = useHistory();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    email: '',
    streetName: '',
    city: '',
    postalCode: '',
  });

  const [hasCheckedProvider, setHasCheckedProvider] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [showTermsDialog, setShowTermsDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createNewProvider(form);
  };

  useEffect(() => {
    const fetchProvider = async () => {
      if (!hasCheckedProvider && auth?.email) {
        setHasCheckedProvider(true);
        try {
          const response = await findByEMail(auth.email);
          if (response) {
            setShowLoader(true);
            setTimeout(() => {
              history.push('/providerChat');
            }, 3000);
          } else {
            setShowTermsDialog(true);
          }
        } catch (err) {
          console.error("Error en findByEMail:", err);
        }
      }
    };
    fetchProvider();
  }, [auth?.email, hasCheckedProvider, findByEMail, history]);

  return (
    <>
      <Paper
        elevation={6}
        sx={{
          p: 3,
          maxWidth: 600,
          mx: 'auto',
          mt: '20px',
          bgcolor: '#ffffff',
          borderRadius: 2,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e0e0e0',
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          align="center"
          sx={{ fontWeight: 'bold', mb: 3, color: '#0D47A1' }}
        >
          Registrame como proveedor P2P
        </Typography>
  
        {provider && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Proveedor creado exitosamente.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message || 'Ocurrió un error'}
          </Alert>
        )}
  
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                label="Primer nombre"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  sx: { borderRadius: '8px' },
                }}
              />
            </Grid>
  
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                label="Apellido"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  sx: { borderRadius: '8px' },
                }}
              />
            </Grid>
  
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                label="Número de identificación"
                name="idNumber"
                value={form.idNumber}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  sx: { borderRadius: '8px' },
                }}
              />
            </Grid>
  
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                label="Correo electrónico"
                name="email"
                value={form.email}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  sx: { borderRadius: '8px' },
                }}
              />
            </Grid>
  
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                label="Nombre de la calle"
                name="streetName"
                value={form.streetName}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  sx: { borderRadius: '8px' },
                }}
              />
            </Grid>
  
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                label="Ciudad"
                name="city"
                value={form.city}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  sx: { borderRadius: '8px' },
                }}
              />
            </Grid>
  
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                label="Código Postal"
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  sx: { borderRadius: '8px' },
                }}
              />
            </Grid>
  
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(45deg, #2196F3, #1976D2)',
                  boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2, #2196F3)',
                  },
                }}
              >
                Crear proveedor
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
  
      <Dialog
        open={showLoader}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #E1F5FE, #81D4FA)',
            borderRadius: '20px',
            p: 3,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', color: '#01579B', fontWeight: 'bold' }}>
          Bienvenido
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: '#01579B',
          }}
        >
          <CircularProgress size={48} sx={{ color: '#01579B' }} />
          <Typography variant="h6" sx={{ textAlign: 'center' }}>
            Baya, ya eres un proveedor. ¡Te queremos!
          </Typography>
        </DialogContent>
      </Dialog>
  
      <Dialog
        open={showTermsDialog}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #E1F5FE, #81D4FA)',
            borderRadius: '20px',
            p: 3,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          },
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', color: '#01579B', fontWeight: 'bold' }}>
          Verificación de identidad
        </DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: '#01579B',
          }}
        >
          <Typography variant="body1" sx={{ textAlign: 'center' }}>
            Al registrarte como proveedor P2P, deberás completar un proceso de verificación de identidad, durante el cual se solicitará información personal con 
            fines de autenticación y cumplimiento normativo.
          </Typography>
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                sx={{ color: '#01579B' }}
              />
            }
            label="Acepto los términos y condiciones."
            sx={{ color: '#01579B' }}
          />
          <Button
            variant="contained"
            color="primary"
            disabled={!termsAccepted}
            onClick={() => setShowTermsDialog(false)}
            sx={{
              py: 1.5,
              background: 'linear-gradient(45deg, #2196F3, #1976D2)',
              boxShadow: '0px 3px 6px rgba(0, 0, 0, 0.1)',
              borderRadius: '10px',
              fontWeight: 'bold',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2, #2196F3)',
              },
            }}
          >
            Aceptar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
