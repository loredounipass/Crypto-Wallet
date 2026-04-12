import React, { useState, forwardRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Container, Typography, Button, Box, Dialog, DialogActions, DialogContent, DialogTitle, Slide } from '../ui/material';
import { styled } from '../ui/styles';

// Styled components with Roboto font
const StyledContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(5),
  textAlign: 'center',
}));

const OptionBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-around',
  padding: theme.spacing(3),
  backgroundColor: '#f4f6f9',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: `0 4px 8px rgba(0, 0, 0, 0.1)`,
  marginTop: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  fontFamily: 'Roboto, sans-serif',
  '&:hover': {
    backgroundColor: '#e0e0e0',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  fontSize: '14px', // Reducción de tamaño de texto
  fontWeight: 500,
  padding: '8px 16px', // Reducción de padding
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: '#007BFF',
  color: '#FFFFFF',
  border: '1px solid #007BFF', // Agregar borde
  '&:hover': {
    backgroundColor: '#0056b3',
    boxShadow: `0 4px 8px rgba(0, 0, 0, 0.2)`,
  },
  fontFamily: 'Roboto, sans-serif',
}));


const DialogStyled = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: '20px',
    backgroundColor: '#F7F9FC',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: theme.spacing(3),
  },
}));

// Transition component wrapped with forwardRef
const TransitionComponent = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const WelcomeTemplate = () => {
  const [openSurvey, setOpenSurvey] = useState(true);  
  const [openMainDialog, setOpenMainDialog] = useState(false); 
  const [openCancelMessage, setOpenCancelMessage] = useState(false); 
  const history = useHistory();

  const handleSurveyClose = () => {
    setOpenSurvey(false);
    setOpenMainDialog(true); 
  };

  const handleClose = () => {
    setOpenMainDialog(false);
    history.push('/chatsupport');
  };

  const handleCancel = () => {
    setOpenMainDialog(false);
    setOpenCancelMessage(true); 
  };

  const handleCancelMessageClose = () => {
    setOpenCancelMessage(false);
    history.push('/'); 
  };

  const handleGoBack = () => {
    setOpenMainDialog(false); 
    setOpenSurvey(true); 
  };
  

  return (
    <StyledContainer maxWidth="lg">
      {/* Survey Dialog for contact reason */}
      <DialogStyled open={openSurvey} onClose={() => setOpenSurvey(false)} TransitionComponent={TransitionComponent}>
        <DialogTitle sx={{ color: '#2C3E50', fontWeight: 'bold', fontSize: '1.5rem', fontFamily: 'Roboto, sans-serif' }}>
          ¿Cuál es el motivo de tu contacto?
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              color: '#2C3E50',
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: 0.4,
              lineHeight: 1.7,
              fontSize: '1.2rem',
              mb: 2,
            }}
          >
            Por favor, selecciona una de las siguientes opciones:
          </Typography>

          <OptionBox onClick={handleSurveyClose}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#007BFF' }}>
              Soporte General
            </Typography>
          </OptionBox>

          <OptionBox onClick={handleSurveyClose}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#007BFF' }}>
            Convertirse en Proveedor P2P
            </Typography>
          </OptionBox>
        </DialogContent>
      </DialogStyled>

      {/* Main Dialog */}
      <DialogStyled open={openMainDialog} onClose={handleCancel} TransitionComponent={TransitionComponent}>
        <DialogTitle sx={{ color: '#2C3E50', fontWeight: 'bold', fontSize: '1.5rem', fontFamily: 'Roboto, sans-serif' }}>
          ¡Bienvenido a Crypto Soporte!
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              color: '#2C3E50',
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: 0.4,
              lineHeight: 1.7,
              fontSize: '1.2rem',
              mb: 2,
            }}
          >
            Antes de comenzar, ten en cuenta que nuestro servicio de <strong>chat</strong> es una herramienta de comunicación privada, exclusivamente para usuarios dentro de la plataforma.
          </Typography>
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              color: '#2C3E50',
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: 0.4,
              lineHeight: 1.7,
              fontSize: '1.2rem',
              mb: 2,
            }}
          >
            Estaremos encantados de resolver cualquier duda o consulta que tengas. Nuestro equipo de soporte está disponible para asistirte con la mayor rapidez y eficiencia. ¡No dudes en preguntarnos lo que necesites!
          </Typography>
        </DialogContent>
        <DialogActions>
          <StyledButton onClick={handleClose}>Aceptar</StyledButton>
          <StyledButton onClick={handleGoBack}>Volver</StyledButton>
          <StyledButton onClick={handleCancel} color="secondary" variant="outlined">Cancelar</StyledButton>
        </DialogActions>
      </DialogStyled>

      {/* Cancelled Dialog Message */}
      <DialogStyled open={openCancelMessage} onClose={handleCancelMessageClose} TransitionComponent={TransitionComponent}>
        <DialogTitle sx={{ color: '#2C3E50', fontWeight: 'bold', fontSize: '1.5rem', fontFamily: 'Roboto, sans-serif' }}>
          ¡Gracias por visitarnos!
        </DialogTitle>
        <DialogContent>
          <Typography
            variant="body1"
            gutterBottom
            sx={{
              color: '#2C3E50',
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: 0.4,
              lineHeight: 1.7,
              fontSize: '1.2rem',
              mb: 2,
            }}
          >
            Puedes contactarnos dentro de nuestros horarios de atención al cliente de 8 am a 6 pm. ¡Esperamos ayudarte pronto!
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#2C3E50',
              fontFamily: 'Roboto, sans-serif',
              letterSpacing: 0.4,
              lineHeight: 1.7,
              fontSize: '1.2rem',
            }}
          >
            O puedes enviarnos un correo a <strong>support@crypto-soporte.com</strong> con tu consulta, estaremos felices de ayudarte.
          </Typography>
        </DialogContent>
        <DialogActions>
          <StyledButton onClick={handleCancelMessageClose}>Cerrar</StyledButton>
        </DialogActions>
      </DialogStyled>
    </StyledContainer>
  );
};

export default WelcomeTemplate;
