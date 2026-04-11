import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  TextField,
  Button,
  Typography,
  Avatar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const ProviderChatComponent = () => {
  const currentUser = 'Yo';

  const chatList = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' },
  ];

  const [selectedChat, setSelectedChat] = useState(chatList[0]);

  const [messagesByChat, setMessagesByChat] = useState({});

  const [input, setInput] = useState('');

  const messagesEndRef = useRef(null);

  const messagesForSelected = useMemo(
    () => messagesByChat[selectedChat.id] || [],
    [messagesByChat, selectedChat.id]
  );

  const handleSend = () => {
    if (input.trim() !== '') {
      const newMessage = {
        text: input,
        timestamp: new Date(),
        sender: currentUser,
      };
      const prevMessages = messagesByChat[selectedChat.id] || [];
      setMessagesByChat({
        ...messagesByChat,
        [selectedChat.id]: [...prevMessages, newMessage],
      });
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesForSelected]);

  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        width: '100%',
        maxWidth: 900,
        height: '90vh',
        margin: 'auto',
      }}
    >
      <Box
        sx={{
          width: 250,
          borderRight: '1px solid #ddd',
          p: 2,
          bgcolor: '#fff',
          overflowY: 'auto',
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Chats
        </Typography>
        <List>
          {chatList.map((chat) => (
            <ListItem
              key={chat.id}
              button
              selected={selectedChat.id === chat.id}
              onClick={() => setSelectedChat(chat)}
            >
              <Avatar sx={{ mr: 1 }}>{chat.name.charAt(0)}</Avatar>
              <ListItemText primary={chat.name} />
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #ddd',
            bgcolor: '#f7f7f7',
          }}
        >
          <Typography variant="h6">{selectedChat.name}</Typography>
        </Box>

        <Box
          sx={{
            flex: 1,
            p: 2,
            bgcolor: '#f7f7f7',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <List sx={{ width: '100%' }}>
            {messagesForSelected.map((msg, index) => (
              <ListItem
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent:
                    msg.sender === currentUser ? 'flex-end' : 'flex-start',
                  py: 0.5,
                }}
              >
                <Box
                  sx={{
                    bgcolor: msg.sender === currentUser ? '#0088cc' : '#e0e0e0',
                    color: msg.sender === currentUser ? '#fff' : '#000',
                    borderRadius: '16px',
                    p: 1,
                    maxWidth: '75%',
                    textAlign: msg.sender === currentUser ? 'right' : 'left',
                  }}
                >
                  {msg.sender !== currentUser && (
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {msg.sender}
                    </Typography>
                  )}
                  <Typography variant="body1">{msg.text}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}
                  >
                    {msg.timestamp.toLocaleTimeString()}
                  </Typography>
                </Box>
              </ListItem>
            ))}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        <Box sx={{ p: 1, borderTop: '1px solid #ddd' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#fff',
              p: '0 8px',
              borderRadius: '25px',
              border: '1px solid #ddd',
              height: '40px',
            }}
          >
            <TextField
              variant="standard"
              placeholder="Escribe tu mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              fullWidth
              InputProps={{
                disableUnderline: true,
              }}
            />
            <Button
              variant="contained"
              onClick={handleSend}
              sx={{
                borderRadius: '50%',
                minWidth: '35px',
                minHeight: '35px',
                ml: 0.5,
                backgroundColor: '#0088cc',
                '&:hover': { backgroundColor: '#007ab8' },
              }}
            >
              <SendIcon style={{ color: '#fff', fontSize: '20px' }} />
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default ProviderChatComponent;
