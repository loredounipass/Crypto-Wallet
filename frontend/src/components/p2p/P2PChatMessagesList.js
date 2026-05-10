import React, { useState } from 'react';
import SecureAudio from './SecureAudio';

export default function P2PChatMessagesList({
  messages,
  authId,
  counterpartName,
  apiOrigin,
  messagesEndRef,
  borderColor
}) {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleDownloadImage = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `imagen_p2p_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error downloading image:', err);
      window.open(url, '_blank');
    }
  };

  const formatTimestamp = (msg) => {
    const raw = msg.createdAt || msg.timestamp || msg.created_at;
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="p2p-chat-messages-scroll" style={{
        flex: 1, padding: '16px 16px 8px', overflowY: 'auto', display: 'flex', flexDirection: 'column',
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
              const time = formatTimestamp(msg);

              const isFirstInGroup = i === 0 || messages[i - 1].sender !== msg.sender;
              const isLastInGroup = i === messages.length - 1 || messages[i + 1].sender !== msg.sender;
              const showName = !isMe && isFirstInGroup;
              const marginTop = i === 0 ? 0 : (isFirstInGroup ? 10 : 2);

              // Emoji sizing logic
              let isOnlyEmojis = false;
              let emojiCount = 0;
              if (!hasNoText && text) {
                const stripped = text.replace(/\s/g, '');
                const hasTextChars = /[\p{L}\p{N}\p{P}]/u.test(stripped);
                if (!hasTextChars && stripped.length > 0) {
                  try {
                    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
                    emojiCount = Array.from(segmenter.segment(stripped)).length;
                    if (emojiCount > 0 && emojiCount <= 10) isOnlyEmojis = true;
                  } catch (e) {
                    emojiCount = Array.from(stripped).length;
                    if (emojiCount > 0 && emojiCount <= 10) isOnlyEmojis = true;
                  }
                }
              }

              let textFontSize = 14;
              let textLineHeight = 1.5;
              if (isOnlyEmojis) {
                if (emojiCount === 1) { textFontSize = 56; textLineHeight = 1.1; }
                else if (emojiCount <= 3) { textFontSize = 36; textLineHeight = 1.2; }
                else { textFontSize = 24; textLineHeight = 1.3; }
              }

              const isTransparentBubble = isOnlyEmojis;

              // Telegram-style asymmetric border radius
              const bubbleRadius = isMe
                ? `${isFirstInGroup ? 18 : 6}px 18px 6px ${isLastInGroup ? 18 : 6}px`
                : `18px ${isFirstInGroup ? 18 : 6}px ${isLastInGroup ? 18 : 6}px 6px`;

              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginTop }}>
                  {showName && (
                    <p style={{ margin: '0 0 3px 8px', fontSize: 11, fontWeight: 600, color: '#8B5CF6' }}>
                      {counterpartName}
                    </p>
                  )}
                  <div style={{
                    maxWidth: '70%', minWidth: 48,
                    padding: isTransparentBubble ? 0 : (isMediaMsg && hasNoText ? 0 : '8px 12px'),
                    borderRadius: isTransparentBubble ? 0 : bubbleRadius,
                    background: isTransparentBubble ? 'transparent' : (isMe ? 'linear-gradient(135deg, #7C3AED, #6366F1)' : '#1E1E2E'),
                    color: isMe ? '#FFF' : '#E2E8F0',
                    border: isTransparentBubble ? 'none' : (isMe ? 'none' : `1px solid ${borderColor}`),
                    boxShadow: isTransparentBubble ? 'none' : (isMe ? '0 1px 4px rgba(124,58,237,0.15)' : '0 1px 3px rgba(0,0,0,0.12)'),
                    overflow: 'hidden',
                    position: 'relative',
                  }}>

                    {/* Multimedia handling */}
                    {(() => {
                      const resolvedUrl = msg.multimediaUrl
                        || (msg.multimedia && typeof msg.multimedia === 'object' ? msg.multimedia.url : null)
                        || null;
                      const fullUrl = resolvedUrl
                        ? (resolvedUrl.startsWith('http') ? resolvedUrl : `${apiOrigin}${resolvedUrl}`)
                        : null;
                      const mediaReady = msg.multimediaStatus === 'ready' || (!msg.multimediaStatus && resolvedUrl);

                      return (
                        <>
                          {/* Image */}
                          {isMediaMsg && msg.type === 'image' && fullUrl && mediaReady && (
                            <img
                              src={fullUrl}
                              alt="imagen"
                              style={{
                                width: '100%',
                                maxHeight: 280,
                                display: 'block',
                                cursor: 'pointer',
                                objectFit: 'cover',
                                borderRadius: hasNoText ? 0 : 8,
                                margin: hasNoText ? 0 : '0 0 6px 0',
                              }}
                              onClick={() => setSelectedImage(fullUrl)}
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
                                width: '100%',
                                maxHeight: 280,
                                display: 'block',
                                borderRadius: hasNoText ? 0 : 8,
                                margin: hasNoText ? 0 : '0 0 6px 0',
                              }}
                            />
                          )}
                          {/* Audio */}
                          {isMediaMsg && msg.type === 'audio' && fullUrl && mediaReady && (
                            <div style={{ padding: hasNoText ? '8px 12px' : '4px 0 4px' }}>
                              <SecureAudio url={fullUrl} isMe={isMe} />
                            </div>
                          )}
                          {/* Processing / uploading states */}
                          {isMediaMsg && (msg.multimediaStatus === 'uploading' || msg.multimediaStatus === 'processing' || (!mediaReady && !fullUrl)) && (
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '10px 14px', borderRadius: 8, margin: '4px 0',
                              backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
                            }}>
                              <span style={{
                                width: 16, height: 16,
                                border: '2px solid #8B5CF6', borderTop: '2px solid transparent',
                                borderRadius: '50%', animation: 'spin 0.8s linear infinite',
                                display: 'inline-block', flexShrink: 0,
                              }} />
                              <span style={{ fontSize: 12, color: '#A78BFA' }}>
                                {msg.multimediaStatus === 'uploading' ? 'Subiendo...' : 'Procesando...'}
                              </span>
                            </div>
                          )}
                          {/* Failed state */}
                          {isMediaMsg && msg.multimediaStatus === 'failed' && (
                            <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 8px' }}>❌ Error al procesar</p>
                          )}
                        </>
                      );
                    })()}

                    {/* Text content */}
                    {!hasNoText && text && (
                      <p style={{
                        margin: 0,
                        fontSize: textFontSize,
                        lineHeight: textLineHeight,
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        whiteSpace: 'pre-wrap',
                        textAlign: isOnlyEmojis ? (isMe ? 'right' : 'left') : 'left'
                      }}>
                        {text}
                      </p>
                    )}

                    {/* Timestamp - inside bubble for media-only, after text otherwise */}
                    {!isTransparentBubble && time && (
                      <div style={{
                        display: 'flex', justifyContent: 'flex-end',
                        marginTop: 2,
                      }}>
                        <span style={{
                          fontSize: 10, color: isMe ? 'rgba(255,255,255,0.55)' : '#64748B',
                          lineHeight: 1,
                        }}>
                          {time}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Timestamp for emoji-only messages (outside bubble) */}
                  {isTransparentBubble && time && (
                    <span style={{ fontSize: 10, color: '#64748B', marginTop: 2, paddingRight: isMe ? 4 : 0, paddingLeft: isMe ? 0 : 4 }}>
                      {time}
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(4px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20
        }} onClick={() => setSelectedImage(null)}>

          {/* Controls Bar */}
          <div style={{
            position: 'absolute', top: 20, right: 20, display: 'flex', gap: 16
          }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => handleDownloadImage(selectedImage)}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF',
                width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              title="Descargar Imagen"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <button
              onClick={() => setSelectedImage(null)}
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#FFF',
                width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              title="Cerrar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <img
            src={selectedImage}
            alt="Ampliación"
            style={{
              maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain',
              borderRadius: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
