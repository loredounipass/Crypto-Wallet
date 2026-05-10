import { useState, useRef, useMemo, useEffect } from 'react';

export default function useP2PChatState({
  socket,
  authId,
  counterpartId,
  allMessages,
  fetchMyMessages,
  createMessage,
  uploadMessage
}) {
  const [messageContent, setMessageContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [isCounterpartTyping, setIsCounterpartTyping] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessagesLength = useRef(0);
  const typingTimeoutRef = useRef(null);
  const isCurrentlyTypingRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Filter messages for this conversation and sort chronologically
  const messages = useMemo(() => {
    if (!allMessages || !counterpartId || !authId) return [];
    return allMessages
      .filter(m => 
        (m.sender === authId && m.receiver === counterpartId) ||
        (m.sender === counterpartId && m.receiver === authId)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [allMessages, counterpartId, authId]);

  // Listen for typing events
  useEffect(() => {
    if (!socket) return;
    const handleTyping = (data) => {
      if (String(data.senderId) === String(counterpartId)) {
        setIsCounterpartTyping(data.isTyping);
      }
    };
    socket.on('typing', handleTyping);
    return () => socket.off('typing', handleTyping);
  }, [socket, counterpartId]);

  // Auto-scroll to bottom only when a new message is added (length increases)
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      scrollToBottom();
    }
    prevMessagesLength.current = messages.length;
  }, [messages]);

  const handleSendMessage = async () => {
    if (!counterpartId || (!messageContent.trim() && !selectedFile) || isSending) return;
    
    const content = messageContent;
    const file = selectedFile;
    setMessageContent('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    if (socket) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      socket.emit('typing', { receiverId: counterpartId, isTyping: false });
      isCurrentlyTypingRef.current = false;
    }
    
    setIsSending(true);
    setChatError('');
    const hadFile = !!file;
    try {
      const payload = {
        receiverId: counterpartId,
        content: content,
        type: file ? 'image' : 'text',
      };

      if (file) {
        const uploaded = await uploadMessage(file, payload);
        if (!uploaded) throw new Error('uploadMessage failed');
      } else {
        const created = await createMessage(payload);
        if (!created) throw new Error('createMessage failed');
      }
      await fetchMyMessages();
      if (hadFile) {
        setTimeout(() => fetchMyMessages(), 3000);
      }
    } catch (e) {
      console.error('Failed to send message', e);
      setChatError('No se pudo enviar el mensaje. Verifica la conexión e intenta de nuevo.');
    } finally { 
      setIsSending(false); 
    }
  };

  const handleSendAudio = async (audioFile) => {
    if (!counterpartId || isSending) return;
    setIsSending(true);
    setChatError('');
    try {
      const payload = { receiverId: counterpartId, content: '', type: 'audio' };
      const uploaded = await uploadMessage(audioFile, payload);
      if (!uploaded) throw new Error('uploadMessage failed');
      await fetchMyMessages();
      setTimeout(() => fetchMyMessages(), 3000);
    } catch (e) {
      console.error('Failed to send audio', e);
      setChatError('No se pudo enviar el audio.');
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    messageContent,
    setMessageContent,
    selectedFile,
    setSelectedFile,
    isSending,
    chatError,
    setChatError,
    isCounterpartTyping,
    fileInputRef,
    messagesEndRef,
    typingTimeoutRef,
    isCurrentlyTypingRef,
    handleSendMessage,
    handleSendAudio
  };
}
