import React, { useState, useEffect, useContext } from 'react';
import { 
    Box, 
    TextField, 
    Typography, 
    List, 
    ListItem, 
    Paper, 
    IconButton, 
    InputAdornment, 
    CircularProgress 
} from '../../ui/material';
import { Send as SendIcon } from '../../ui/icons';
import { AuthContext } from '../../hooks/AuthContext';
import useProviders from '../../hooks/useProviders';

const ChatComponent = () => {
    const [messageContent, setMessageContent] = useState('');
    const [chatId, setChatId] = useState(null);
    const { messages, sendMessage, getMessages } = useProviders();
    const { auth } = useContext(AuthContext);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const fetchMessages = async (chatId) => {
            await getMessages(chatId);
        };

        const chatData = JSON.parse(localStorage.getItem('chatData'));
        if (chatData) {
            setChatId(chatData.chat.chatId);
            fetchMessages(chatData.chat.chatId);
        }
    }, [getMessages]);

    const handleSendMessage = async () => {
      if (!messageContent.trim() || isSending) return;
      setIsSending(true);
      try {
          await sendMessage(auth.email, chatId, messageContent);
          setMessageContent('');
          await getMessages(chatId);
      } catch (error) {
          console.error("Error al enviar el mensaje:", error);
      } finally {
          setIsSending(false);
      }
  };
  

    return (
        <Box 
            sx={{ 
                height: 'calc(85vh - 40px)', 
                width: '85%', 
                maxWidth: 800, 
                margin: 'auto', 
                bgcolor: '#f0f2f5', 
                p: 2 
            }}
        >
            <Paper 
                elevation={3} 
                sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderRadius: 3 
                }}
            >
                <Box 
                    sx={{ 
                        p: 2, 
                        borderBottom: 1, 
                        borderColor: 'divider', 
                        bgcolor: '#fff' 
                    }}
                >
                    <Typography variant="h6" align="center">
                        Chat
                    </Typography>
                </Box>

                <Box 
                    sx={{ 
                        flex: 1, 
                        overflow: 'auto', 
                        p: 2, 
                        bgcolor: '#fff' 
                    }}
                >
                    {messages.length === 0 ? (
                        <Typography variant="body1" align="center" color="text.secondary">
                            Aún no hay mensajes
                        </Typography>
                    ) : (
                        <List>
                            {messages.map((message, index) => (
                                <ListItem
                                    key={index}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: message.sender === auth.email ? 'flex-end' : 'flex-start',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            backgroundColor: message.sender === auth.email ? '#e0f7fa' : '#f1f8e9',
                                            color: message.sender === auth.email ? '#00796b' : '#33691e',
                                            borderRadius: 2,
                                            padding: 1,
                                            maxWidth: '70%',
                                        }}
                                    >
                                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                            {message.sender === auth.email ? 'You' : message.sender}
                                        </Typography>
                                        <Typography variant="body2">{message.message}</Typography>
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>

                <Box 
                    sx={{ 
                        p: 2, 
                        bgcolor: '#fff', 
                        borderTop: 1, 
                        borderColor: 'divider' 
                    }}
                >
                    <TextField
                        fullWidth
                        placeholder="Escribe tu mensaje..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={handleSendMessage}
                                        disabled={!messageContent.trim() || isSending}
                                        sx={{ bgcolor: 'primary.main', color: '#fff', '&:hover': { bgcolor: 'primary.dark' } }}
                                    >
                                        {isSending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default ChatComponent;
