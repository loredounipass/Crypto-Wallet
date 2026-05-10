import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { Send as SendIcon } from '../../ui/icons';
import { TrashIcon, PaperclipIcon, MicIcon } from './ChatIcons';

export default function P2PChatInputArea({
  isRecording,
  recordingTime,
  stopRecording,
  startRecording,
  messageContent,
  setMessageContent,
  selectedFile,
  setSelectedFile,
  fileInputRef,
  handleSendMessage,
  socket,
  counterpartId,
  isCurrentlyTypingRef,
  typingTimeoutRef,
  borderColor,
  chatError
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const onEmojiClick = (emojiObject) => {
    setMessageContent((prev) => prev + emojiObject.emoji);
  };

  return (
    <div style={{ padding: 12, borderTop: `1px solid ${borderColor}`, position: 'relative' }}>
      {showEmojiPicker && (
        <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: '100%', left: 16, zIndex: 50, marginBottom: 8 }}>
          <EmojiPicker 
            onEmojiClick={onEmojiClick} 
            theme="dark"
            autoFocusSearch={false}
          />
        </div>
      )}
      {selectedFile && (
        <div style={{
          marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px', backgroundColor: '#1A1A2E', borderRadius: 12,
          border: `1px solid rgba(139,92,246,0.2)`
        }}>
          {/* Image thumbnail */}
          {selectedFile.type?.startsWith('image/') ? (
            <div style={{
              width: 48, height: 48, borderRadius: 8, overflow: 'hidden',
              flexShrink: 0, backgroundColor: '#0F0F1A',
            }}>
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: 8, flexShrink: 0,
              background: 'rgba(139,92,246,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 22 }}>📎</span>
            </div>
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedFile.name}
            </span>
            <span style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 500 }}>
              {selectedFile.size < 1024 * 1024
                ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
              }
            </span>
          </div>
          <button 
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444',
              cursor: 'pointer', width: 30, height: 30, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}
      {isRecording ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '6px 12px', borderRadius: 24,
          border: `1px solid #EF4444`,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          flex: 1, height: 52
        }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#EF4444', animation: 'pulse 1.5s infinite' }} />
          <span style={{ color: '#EF4444', fontWeight: '500', flex: 1, fontSize: 14 }}>Grabando... {formatTime(recordingTime)}</span>
          <button 
            onClick={() => stopRecording(true)}
            style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 8 }}
            title="Cancelar"
          >
            <TrashIcon />
          </button>
          <button 
            onClick={() => stopRecording(false)}
            style={{ 
              width: 34, height: 34, borderRadius: '50%', border: 'none',
              background: '#10B981', color: '#FFF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title="Enviar audio"
          >
            <SendIcon style={{ fontSize: 16 }} />
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 6px 6px 16px', borderRadius: 24,
          border: `1px solid ${borderColor}`,
          backgroundColor: '#0F0F1A',
        }}>
          <input
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: 14,
              backgroundColor: 'transparent',
              color: '#E2E8F0',
            }}
            placeholder="Escribe tu mensaje..."
            value={messageContent}
            onChange={e => {
              setMessageContent(e.target.value);
              if (socket && counterpartId) {
                if (!isCurrentlyTypingRef.current) {
                  socket.emit('typing', { receiverId: counterpartId, isTyping: true });
                  isCurrentlyTypingRef.current = true;
                }
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                  socket.emit('typing', { receiverId: counterpartId, isTyping: false });
                  isCurrentlyTypingRef.current = false;
                }, 2000);
              }
            }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
          />
          <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            <div 
              style={{ display: 'flex', padding: 6, color: '#94A3B8', transition: 'color 0.2s', borderRadius: '50%' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#C084FC'; e.currentTarget.style.backgroundColor = 'rgba(192, 132, 252, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <PaperclipIcon />
            </div>
          </label>
          
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', padding: 6, color: showEmojiPicker ? '#C084FC' : '#94A3B8', 
              transition: 'color 0.2s', borderRadius: '50%',
              backgroundColor: showEmojiPicker ? 'rgba(192, 132, 252, 0.1)' : 'transparent'
            }}
            onMouseEnter={(e) => { if(!showEmojiPicker) { e.currentTarget.style.color = '#C084FC'; e.currentTarget.style.backgroundColor = 'rgba(192, 132, 252, 0.1)'; } }}
            onMouseLeave={(e) => { if(!showEmojiPicker) { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = 'transparent'; } }}
            title="Añadir emoji"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </button>

          <button
            onClick={() => {
              if (messageContent.trim() || selectedFile) {
                handleSendMessage();
              } else {
                startRecording();
              }
            }}
            disabled={!counterpartId}
            style={{
              width: 38, height: 38, borderRadius: '50%', border: 'none',
              background: counterpartId ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : '#2D2D44',
              color: '#FFF', cursor: counterpartId ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: counterpartId ? '0 4px 14px 0 rgba(139, 92, 246, 0.39)' : 'none',
              transform: 'scale(1)'
            }}
            onMouseEnter={e => { if (counterpartId) e.currentTarget.style.transform = 'scale(1.05)' }}
            onMouseLeave={e => { if (counterpartId) e.currentTarget.style.transform = 'scale(1)' }}
          >
            {messageContent.trim() || selectedFile ? <SendIcon style={{ fontSize: 18, marginLeft: 2 }} /> : <MicIcon style={{ fontSize: 18 }} />}
          </button>
        </div>
      )}
      <div style={{ minHeight: 18, margin: '8px 8px 0' }}>
        {chatError && (
          <p style={{ margin: 0, fontSize: 12, color: '#F87171' }}>
            {chatError}
          </p>
        )}
        {!chatError && !counterpartId && (
          <p style={{ margin: 0, fontSize: 12, color: '#F59E0B' }}>
            No se pudo identificar la contraparte de esta orden. Reintenta en unos segundos.
          </p>
        )}
      </div>
    </div>
  );
}
