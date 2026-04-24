import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Send as SendIcon } from '../../ui/icons';
import { AuthContext } from '../../hooks/AuthContext';
import useEscrow from '../../hooks/useEscrow';
import useMessagesAndMultimedia from '../../hooks/useMessagesAndMultimedia';
import P2POrderStatus from './P2POrderStatus';
import P2PDisputeModal from './P2PDisputeModal';

import { get } from '../../api/http';

export default function P2POrderChat() {
  const { orderId } = useParams();
  const { auth } = useContext(AuthContext);
  
  
  const { currentOrder, getOrder, confirmPayment, releaseFunds, openDispute, cancelOrder, isLoading } = useEscrow();
  const { messages: allMessages, fetchMyMessages, createMessage, uploadMessage, joinChat } = useMessagesAndMultimedia();

  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [counterpartId, setCounterpartId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const isProvider = currentOrder?.providerEmail === auth?.email;
  const isSeller = currentOrder?.sellerEmail === auth?.email;
  const counterpartEmail = isProvider ? currentOrder?.sellerEmail : currentOrder?.providerEmail;

  const fetchOrder = useCallback(async () => {
    if (orderId) {
      await getOrder(orderId);
    }
  }, [orderId, getOrder]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Fetch the counterpart user's ID
  useEffect(() => {
    const fetchCounterpart = async () => {
      if (!counterpartEmail) return;
      try {
        const res = await get(`/user/search?q=${counterpartEmail}`);
        if (res?.data?.length > 0) {
          setCounterpartId(res.data[0]._id);
        }
      } catch (e) {
        console.error('Failed to fetch counterpart user', e);
      }
    };
    fetchCounterpart();
  }, [counterpartEmail]);

  // Join socket room and fetch initial messages when counterpart is known
  useEffect(() => {
    if (counterpartId && auth?._id) {
      joinChat(counterpartId);
      fetchMyMessages();
    }
  }, [counterpartId, auth?._id, joinChat, fetchMyMessages]);

  // Filter messages for this conversation and sort chronologically
  const messages = useMemo(() => {
    if (!allMessages || !counterpartId || !auth?._id) return [];
    return allMessages
      .filter(m => 
        (m.sender === auth._id && m.receiver === counterpartId) ||
        (m.sender === counterpartId && m.receiver === auth._id)
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [allMessages, counterpartId, auth?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!counterpartId || (!messageContent.trim() && !fileInputRef.current?.files[0]) || isSending) return;
    setIsSending(true);
    try {
      const file = fileInputRef.current?.files[0];
      const payload = {
        receiverId: counterpartId,
        content: messageContent,
        type: file ? (file.type.startsWith('image/') ? 'image' : 'video') : 'text',
      };

      if (file) {
        await uploadMessage(file, payload);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        await createMessage(payload);
      }
      setMessageContent('');
      await fetchMyMessages();
    } catch (e) {
      console.error('Failed to send message', e);
    } finally { 
      setIsSending(false); 
    }
  };

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === 'confirm') await confirmPayment(orderId);
      else if (action === 'release') await releaseFunds(orderId);
      else if (action === 'cancel') await cancelOrder(orderId);
      await fetchOrder();
    } catch (e) { /* handled by hook */ }
    finally { setActionLoading(''); }
  };

  const handleDispute = async (reason) => {
    setActionLoading('dispute');
    try {
      await openDispute(orderId, reason);
      setShowDispute(false);
      await fetchOrder();
    } catch (e) { /* handled by hook */ }
    finally { setActionLoading(''); }
  };

  if (!currentOrder && !isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        Cargando orden...
      </div>
    );
  }

  const cardBg = '#1A1A2E';
  const borderColor = '#2D2D44';

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 100px)', flexWrap: 'wrap' }}>
      {/* LEFT: Chat */}
      <div style={{
        flex: '1 1 58%', minWidth: 320,
        display: 'flex', flexDirection: 'column',
        borderRadius: 16, border: `1px solid ${borderColor}`,
        backgroundColor: cardBg, overflow: 'hidden',
      }}>
        {/* Chat Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2186EB, #1A6BC7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFF', fontSize: 14, fontWeight: 700,
          }}>
            {(isProvider ? currentOrder?.sellerEmail : currentOrder?.providerEmail)?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#F1F5F9' }}>
              Chat P2P
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>
              {isProvider ? currentOrder?.sellerEmail : currentOrder?.providerEmail}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 16,
          backgroundColor: '#0F0F1A',
        }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 40 }}>
              Aún no hay mensajes. Coordina el pago con tu contraparte.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map((msg, i) => {
                const isMe = msg.sender === auth?._id;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: 14,
                      backgroundColor: isMe
                        ? 'linear-gradient(135deg, #2186EB, #1A6BC7)' 
                        : ('#1E1E2E'),
                      background: isMe ? 'linear-gradient(135deg, #2186EB, #1A6BC7)' : undefined,
                      color: isMe ? '#FFF' : ('#E2E8F0'),
                      border: isMe ? 'none' : `1px solid ${borderColor}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}>
                      {!isMe && (
                        <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600, color: '#2186EB' }}>
                          {counterpartEmail}
                        </p>
                      )}
                      
                      {/* Multimedia handling */}
                      {msg.multimediaUrl && msg.type === 'image' && (
                        <img 
                          src={msg.multimediaUrl} 
                          alt="adjunto" 
                          style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8, display: 'block' }} 
                        />
                      )}
                      {msg.multimediaUrl && msg.type === 'video' && (
                        <video 
                          src={msg.multimediaUrl} 
                          controls 
                          style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8, display: 'block' }} 
                        />
                      )}
                      {msg.multimediaStatus === 'uploading' && <p style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.8 }}>Subiendo archivo...</p>}
                      {msg.multimediaStatus === 'processing' && <p style={{ fontSize: 12, fontStyle: 'italic', opacity: 0.8 }}>Procesando archivo...</p>}

                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{msg.content || msg.message}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: 12, borderTop: `1px solid ${borderColor}` }}>
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
              onChange={e => setMessageContent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            />
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*,video/*"
                onChange={() => {
                  // just focus input or show some indicator if we wanted, 
                  // but we will rely on the input ref directly for sending
                }}
              />
              <span style={{ fontSize: 18, color: '#94A3B8', marginRight: 4 }}>📎</span>
            </label>
            <button
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || isSending}
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none',
                background: messageContent.trim() ? 'linear-gradient(135deg, #2186EB, #1A6BC7)' : ('#2D2D44'),
                color: '#FFF', cursor: messageContent.trim() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {isSending
                ? <span style={{ width: 16, height: 16, border: '2px solid #FFF', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
                : <SendIcon style={{ fontSize: 18 }} />
              }
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: Order Panel */}
      <div style={{
        flex: '1 1 38%', minWidth: 300, maxWidth: 420,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Order Status Card */}
        <div style={{
          borderRadius: 16, padding: 24,
          border: `1px solid ${borderColor}`, backgroundColor: cardBg,
        }}>
          <h3 style={{
            margin: '0 0 16px', fontSize: 16, fontWeight: 700,
            color: '#F1F5F9',
          }}>
            Estado de la Orden
          </h3>
          <P2POrderStatus status={currentOrder?.status} />
        </div>

        {/* Order Details Card */}
        <div style={{
          borderRadius: 16, padding: 24,
          border: `1px solid ${borderColor}`, backgroundColor: cardBg,
          flex: 1,
        }}>
          <h3 style={{
            margin: '0 0 16px', fontSize: 16, fontWeight: 700,
            color: '#F1F5F9',
          }}>
            Detalles
          </h3>

          {[
            { label: 'Cantidad', value: `${currentOrder?.amount} ${currentOrder?.coin}` },
            { label: 'Monto USD', value: `$${currentOrder?.fiatAmount}` },
            { label: 'Método de Pago', value: currentOrder?.paymentMethod },
            { label: 'Tu rol', value: isSeller ? '🏷️ Vendedor' : '🏪 Proveedor' },
            { label: 'Orden ID', value: currentOrder?.orderId?.slice(0, 12) + '...' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < 4 ? `1px solid ${'#1E1E2E'}` : 'none',
            }}>
              <span style={{ fontSize: 13, color: '#94A3B8' }}>{item.label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>
                {item.value}
              </span>
            </div>
          ))}

          {/* Action Buttons */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Provider: Confirm Payment */}
            {isProvider && currentOrder?.status === 'funded' && (
              <button
                onClick={() => handleAction('confirm')}
                disabled={actionLoading === 'confirm'}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  opacity: actionLoading === 'confirm' ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                }}
              >
                {actionLoading === 'confirm' ? 'Confirmando...' : '✅ Confirmar Pago Recibido'}
              </button>
            )}

            {/* Seller: Release Funds */}
            {isSeller && currentOrder?.status === 'buyer_paid' && (
              <button
                onClick={() => handleAction('release')}
                disabled={actionLoading === 'release'}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #2186EB, #1A6BC7)',
                  color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  opacity: actionLoading === 'release' ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(33,134,235,0.3)',
                }}
              >
                {actionLoading === 'release' ? 'Liberando...' : '🔓 Liberar Fondos'}
              </button>
            )}

            {/* Dispute - both can open */}
            {['funded', 'buyer_paid'].includes(currentOrder?.status) && (
              <button
                onClick={() => setShowDispute(true)}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  border: `1px solid ${'#2D2D44'}`,
                  backgroundColor: 'transparent',
                  color: '#EF4444', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ⚠️ Abrir Disputa
              </button>
            )}

            {/* Seller: Cancel */}
            {isSeller && currentOrder?.status === 'funded' && (
              <button
                onClick={() => handleAction('cancel')}
                disabled={actionLoading === 'cancel'}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  border: `1px solid ${'#2D2D44'}`,
                  backgroundColor: 'transparent',
                  color: '#94A3B8',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  opacity: actionLoading === 'cancel' ? 0.7 : 1,
                }}
              >
                {actionLoading === 'cancel' ? 'Cancelando...' : 'Cancelar Orden'}
              </button>
            )}

            {/* Completed message */}
            {currentOrder?.status === 'completed' && (
              <div style={{
                padding: 16, borderRadius: 12, textAlign: 'center',
                backgroundColor: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}>
                <p style={{ margin: 0, fontSize: 20, marginBottom: 4 }}>🎉</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#10B981' }}>
                  ¡Orden completada exitosamente!
                </p>
              </div>
            )}

            {/* Disputed message */}
            {currentOrder?.status === 'disputed' && (
              <div style={{
                padding: 16, borderRadius: 12,
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
              }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#EF4444' }}>
                  Disputa abierta
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8' }}>
                  {currentOrder?.disputeReason}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94A3B8' }}>
                  Por: {currentOrder?.disputeOpenedBy}
                </p>
              </div>
            )}

            {/* Waiting messages */}
            {isSeller && currentOrder?.status === 'funded' && (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#F59E0B', margin: 0 }}>
                ⏳ Esperando que el proveedor confirme el pago externo...
              </p>
            )}
            {isProvider && currentOrder?.status === 'buyer_paid' && (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#3B82F6', margin: 0 }}>
                ⏳ Esperando que el vendedor libere los fondos...
              </p>
            )}
            {currentOrder?.status === 'released' && (
              <p style={{ textAlign: 'center', fontSize: 13, color: '#8B5CF6', margin: 0 }}>
                ⏳ Procesando liberación de fondos on-chain...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dispute Modal */}
      <P2PDisputeModal
        open={showDispute}
        onClose={() => setShowDispute(false)}
        onSubmit={handleDispute}
        isLoading={actionLoading === 'dispute'}
      />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
