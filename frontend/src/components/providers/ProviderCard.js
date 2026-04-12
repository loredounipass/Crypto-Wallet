import React, { useEffect, useState, useContext, useCallback } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button, 
  Alert,
  CircularProgress  // Added this import
} from '../../ui/material';
import useProvider from '../../hooks/useProviders';
import { AuthContext } from '../../hooks/AuthContext';

export default function ProviderCard() {
  const { getAllProviders, createChat } = useProvider();
  const { auth } = useContext(AuthContext);
  const [providers, setProviders] = useState([]);
  const [error, setError] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  const fetchProviders = useCallback(async () => {
    try {
      const res = await getAllProviders();
      if (res && res.length > 0) {
        setProviders(res);
        setError(null);
      } else {
        setError({ message: 'No se encontraron proveedores.' });
        setProviders([]);
      }
    } catch (err) {
      setError(err);
      setProviders([]);
    }
  }, [getAllProviders]);

  const handleCreateChat = async (providerEmail) => {
    if (!auth?.email || isCreatingChat) return;
    
    setIsCreatingChat(true);
    
    try {
      const chatBody = {
        chatName: `Chat con ${providerEmail}`,
        users: [auth.email, providerEmail],
        latestMessage: 'Chat iniciado'
      };

      const response = await createChat(chatBody);
      
      if (response?.chatroomId) {
        // Clear any existing chat data first
        localStorage.removeItem('chatData');
        
        // Save new chat data with timestamp
        const chatData = {
          chat: {
            chatroomId: response.chatroomId,
            providerEmail,
            userEmail: auth.email,
            createdAt: new Date().toISOString()
          }
        };
        
        localStorage.setItem('chatData', JSON.stringify(chatData));
        window.location.href = '/chat';
      } else {
        throw new Error('No se recibió un ID de chat válido');
      }
    } catch (err) {
      console.error('Error al crear el chat:', err);
      alert(`Error al crear el chat: ${err.message}`);
    } finally {
      setIsCreatingChat(false);
    }
  };

  useEffect(() => {
    // Clear old chat data when component mounts
    localStorage.removeItem('chatData');
    fetchProviders();
  }, [fetchProviders]);

  return (
    <Box sx={{ padding: 3 }}>
      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          {error.message || 'Ocurrió un error al cargar los proveedores.'}
        </Alert>
      )}

      <Grid container spacing={2}>
        {providers.map((provider) => (
          <Grid item xs={12} sm={6} md={4} key={provider._id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {provider.firstName} {provider.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Correo electrónico: {provider.email}
                </Typography>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleCreateChat(provider.email)}
                    disabled={isCreatingChat}
                  >
                    {isCreatingChat ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Vender P2P'
                    )}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
