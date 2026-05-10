import React from 'react';
import SecureAudio from './SecureAudio';

export default function P2PChatMessagesList({
  messages,
  authId,
  counterpartEmail,
  apiOrigin,
  messagesEndRef,
  borderColor
}) {
  return (
    <div className="p2p-chat-messages-scroll" style={{
      flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20
    }}>
      {messages.length === 0 ? (
        <div style={{ margin: 'auto', textAlign: 'center', color: '#94A3B8' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 16px', borderRadius: '50%', backgroundColor: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 24 }}>💬</span>
          </div>
          <p style={{ margin: 0, fontSize: 14 }}>No hay mensajes aún.</p>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>¡Escribe "Hola" para comenzar!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {messages.map((msg, i) => {
            const isMe = msg.sender === authId;
            const text = msg.content || msg.message || '';
            const isMediaMsg = msg.type === 'image' || msg.type === 'video' || msg.type === 'audio';
            const hasNoText = isMediaMsg && (!text.trim() || text.trim() === '📎adjunto');
            
            const isFirstInGroup = i === 0 || messages[i - 1].sender !== msg.sender;
            const showName = !isMe && isFirstInGroup;
            const marginTop = i === 0 ? 0 : (isFirstInGroup ? 16 : 4);

            const isAudioOnly = msg.type === 'audio' && hasNoText;

            return (
              <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginTop }}>
                <div style={{
                  maxWidth: '70%', minWidth: 40, 
                  padding: isAudioOnly ? 0 : '10px 14px', 
                  borderRadius: isAudioOnly ? 24 : 14,
                  backgroundColor: isAudioOnly ? 'transparent' : (isMe ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : '#1E1E2E'),
                  background: isAudioOnly ? 'transparent' : (isMe ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : undefined),
                  color: isMe ? '#FFF' : ('#E2E8F0'),
                  border: isAudioOnly ? 'none' : (isMe ? 'none' : `1px solid ${borderColor}`),
                  boxShadow: isAudioOnly ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                  overflow: 'hidden', // Ensures images flush with edges stay rounded
                }}>
                  {showName && (
                    <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: '#8B5CF6' }}>
                      {counterpartEmail}
                    </p>
                  )}
                  
                  {/* Multimedia handling */}
                  {(() => {
                    // Resolve the multimedia URL from various possible shapes
                    const resolvedUrl = msg.multimediaUrl
                      || (msg.multimedia && typeof msg.multimedia === 'object' ? msg.multimedia.url : null)
                      || null;
                    const fullUrl = resolvedUrl
                      ? (resolvedUrl.startsWith('http') ? resolvedUrl : `${apiOrigin}${resolvedUrl}`)
                      : null;
                    const mediaReady = msg.multimediaStatus === 'ready' || (!msg.multimediaStatus && resolvedUrl);

                    // If the message is purely media, we expand it to touch the bubble edges
                    const imageMargin = hasNoText 
                      ? (isMe ? '-10px -14px' : '8px -14px -10px -14px') 
                      : '0 0 8px 0';
                    const imageRadius = hasNoText ? 0 : 8; // Wrapper handles outer rounding

                    return (
                      <>
                        {/* Image */}
                        {isMediaMsg && msg.type === 'image' && fullUrl && mediaReady && (
                          <img 
                            src={fullUrl} 
                            alt="imagen" 
                            style={{ 
                              width: hasNoText ? 'calc(100% + 28px)' : '100%', 
                              maxWidth: hasNoText ? 'calc(100% + 28px)' : '100%', 
                              maxHeight: 240, 
                              borderRadius: imageRadius, 
                              margin: imageMargin, 
                              display: 'block', 
                              cursor: 'pointer', 
                              objectFit: 'cover' 
                            }} 
                            onClick={() => window.open(fullUrl, '_blank')}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.insertAdjacentHTML('afterend', '<p style="font-size:12px;color:#F59E0B;margin:4px 0 8px;">⚠️ No se pudo cargar la imagen</p>');
                            }}
                          />
                        )}
                        {/* Video */}
                        {isMediaMsg && msg.type === 'video' && fullUrl && mediaReady && (
                          <video 
                            src={fullUrl} 
                            controls 
                            style={{ 
                              width: hasNoText ? 'calc(100% + 28px)' : '100%', 
                              maxWidth: hasNoText ? 'calc(100% + 28px)' : '100%', 
                              borderRadius: imageRadius, 
                              margin: imageMargin, 
                              display: 'block' 
                            }} 
                          />
                        )}
                        {/* Audio */}
                        {isMediaMsg && msg.type === 'audio' && fullUrl && mediaReady && (
                          <SecureAudio 
                            url={fullUrl} 
                            controls 
                            style={{ 
                              width: '240px', 
                              maxWidth: '100%', 
                              margin: hasNoText ? '0' : '0 0 8px 0', 
                              display: 'block',
                              borderRadius: '24px'
                            }} 
                          />
                        )}
                        {/* Processing / uploading states */}
                        {isMediaMsg && (msg.multimediaStatus === 'uploading' || msg.multimediaStatus === 'processing' || (!mediaReady && !fullUrl)) && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '12px 16px', borderRadius: 8, marginBottom: 8,
                            backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
                          }}>
                            <span style={{
                              width: 18, height: 18,
                              border: '2px solid #8B5CF6', borderTop: '2px solid transparent',
                              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                              display: 'inline-block', flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 12, color: '#A78BFA' }}>
                              {msg.multimediaStatus === 'uploading' ? 'Subiendo archivo...' : 'Procesando imagen...'}
                            </span>
                          </div>
                        )}
                        {/* Failed state */}
                        {isMediaMsg && msg.multimediaStatus === 'failed' && (
                          <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 8px' }}>❌ Error al procesar el archivo</p>
                        )}
                      </>
                    );
                  })()}

                  {/* Text content — hide placeholder text for media messages that have a resolved URL */}
                  {!hasNoText && text && (
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{text}</p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
