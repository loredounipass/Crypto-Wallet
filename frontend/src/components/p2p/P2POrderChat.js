import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Send as SendIcon } from '../../ui/icons';
import { AuthContext } from '../../hooks/AuthContext';
import useEscrow from '../../hooks/useEscrow';
import useMessagesAndMultimedia from '../../hooks/useMessagesAndMultimedia';
import P2POrderStatus from './P2POrderStatus';
import P2PDisputeModal from './P2PDisputeModal';

import { get, apiOrigin } from '../../api/http';

const ChatBubbleIcon = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const FileTextIcon = (props) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

export default function P2POrderChat() {
  const { orderId } = useParams();
  const { auth } = useContext(AuthContext);
  
  
  const { currentOrder, getOrder, confirmPayment, releaseFunds, openDispute, cancelOrder, isLoading } = useEscrow();
  const { messages: allMessages, fetchMyMessages, createMessage, uploadMessage, joinChat } = useMessagesAndMultimedia();

  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [counterpartId, setCounterpartId] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState('chat'); // 'chat' | 'details'
  const [selectedFile, setSelectedFile] = useState(null);
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
        const res = await get('/user/search', { q: counterpartEmail });
        const users = Array.isArray(res?.data?.data)
          ? res.data.data
          : (Array.isArray(res?.data) ? res.data : []);
        if (users.length > 0) {
          setCounterpartId(users[0]._id);
          setChatError('');
        } else {
          setCounterpartId(null);
          setChatError('No se encontró el usuario contraparte para esta orden.');
        }
      } catch (e) {
        console.error('Failed to fetch counterpart user', e);
        setCounterpartId(null);
        setChatError('No se pudo resolver la contraparte. Intenta recargar la página.');
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

  const handleSendMessage = async () => {
    if (!counterpartId || (!messageContent.trim() && !selectedFile) || isSending) return;
    setIsSending(true);
    setChatError('');
    try {
      const payload = {
        receiverId: counterpartId,
        content: messageContent,
        type: selectedFile ? 'image' : 'text',
      };

      if (selectedFile) {
        const uploaded = await uploadMessage(selectedFile, payload);
        if (!uploaded) throw new Error('uploadMessage failed');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const created = await createMessage(payload);
        if (!created) throw new Error('createMessage failed');
      }
      setMessageContent('');
      await fetchMyMessages();
    } catch (e) {
      console.error('Failed to send message', e);
      setChatError('No se pudo enviar el mensaje. Verifica la conexión e intenta de nuevo.');
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
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(139,92,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>
        Cargando orden...
      </div>
    );
  }

  const cardBg = '#1A1A2E';
  const borderColor = '#2D2D44';

  return (
    <div className="p2p-chat-layout" style={{ display: 'grid', gap: 16, height: 'calc(100dvh - 16px)', minHeight: 'calc(100dvh - 16px)', width: '100%', overflow: 'hidden', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 420px)' }}>
      {/* LEFT: Chat */}
      <div className={`p2p-chat-panel ${activeMobileTab !== 'chat' ? 'hide-on-mobile' : ''}`} style={{
        minWidth: 0,
        height: '100%',
        minHeight: 0,
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
            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
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
        <div className="p2p-chat-messages-scroll" style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: 16,
          backgroundColor: '#0F0F1A',
        }}>
          <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          justifyContent: 'flex-end',
          }}>
          {messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 40 }}>
              Aún no hay mensajes. Coordina el pago con tu contraparte.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
              {messages.map((msg, i) => {
                const isMe = msg.sender === auth?._id;
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: 14,
                      backgroundColor: isMe
                        ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' 
                        : ('#1E1E2E'),
                      background: isMe ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : undefined,
                      color: isMe ? '#FFF' : ('#E2E8F0'),
                      border: isMe ? 'none' : `1px solid ${borderColor}`,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    }}>
                      {!isMe && (
                        <p style={{ margin: '0 0 2px', fontSize: 11, fontWeight: 600, color: '#8B5CF6' }}>
                          {counterpartEmail}
                        </p>
                      )}
                      
                      {/* Multimedia handling */}
                      {msg.multimediaUrl && msg.type === 'image' && (
                        <img 
                          src={msg.multimediaUrl.startsWith('http') ? msg.multimediaUrl : `${apiOrigin}${msg.multimediaUrl}`} 
                          alt="adjunto" 
                          style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8, display: 'block', cursor: 'pointer' }} 
                          onClick={() => window.open(msg.multimediaUrl.startsWith('http') ? msg.multimediaUrl : `${apiOrigin}${msg.multimediaUrl}`, '_blank')}
                        />
                      )}
                      {msg.multimediaUrl && msg.type === 'video' && (
                        <video 
                          src={msg.multimediaUrl.startsWith('http') ? msg.multimediaUrl : `${apiOrigin}${msg.multimediaUrl}`} 
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
            </div>
          )}
          </div>
        </div>

        {/* Input */}
        <div style={{ padding: 12, borderTop: `1px solid ${borderColor}` }}>
          {selectedFile && (
            <div style={{
              marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', backgroundColor: '#1E1E2E', borderRadius: 8,
              border: `1px solid ${borderColor}`
            }}>
              <span style={{ fontSize: 18 }}>🖼️</span>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <span style={{ fontSize: 13, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedFile.name}
                </span>
                <span style={{ fontSize: 11, color: '#94A3B8' }}>
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#EF4444',
                  cursor: 'pointer', width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                }}>
                ✕
              </button>
            </div>
          )}
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
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <span style={{ fontSize: 18, color: '#94A3B8', marginRight: 4 }}>📎</span>
            </label>
            <button
              onClick={handleSendMessage}
              disabled={!counterpartId || (!messageContent.trim() && !selectedFile) || isSending}
              style={{
                width: 38, height: 38, borderRadius: '50%', border: 'none',
                background: (counterpartId && (messageContent.trim() || selectedFile)) ? 'linear-gradient(135deg, #8B5CF6, #6366F1)' : ('#2D2D44'),
                color: '#FFF', cursor: (counterpartId && (messageContent.trim() || selectedFile)) ? 'pointer' : 'not-allowed',
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
      </div>

      {/* RIGHT: Order Panel */}
      <div className={`p2p-order-panel p2p-order-scroll-hidden ${activeMobileTab !== 'details' ? 'hide-on-mobile' : ''}`} style={{
        minWidth: 0,
        height: '100%',
        minHeight: 0,
        display: 'flex', flexDirection: 'column', gap: 16,
        overflowY: 'auto', overflowX: 'hidden',
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
        <div className="p2p-order-scroll-hidden" style={{
          borderRadius: 16, padding: 24,
          border: `1px solid ${borderColor}`, backgroundColor: cardBg,
          flex: 1, minHeight: 0, overflowY: 'auto',
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
                  background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                  color: '#FFF', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  opacity: actionLoading === 'release' ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(139,92,246,0.3)',
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

      {/* Mobile Bottom Nav */}
      <div className="mobile-bottom-nav" style={{
        display: 'none', // hidden by default, shown via CSS
        justifyContent: 'space-around', alignItems: 'center',
        backgroundColor: cardBg, border: `1px solid ${borderColor}`, borderRadius: 16,
        padding: '10px 0', margin: '0',
      }}>
        <button 
          onClick={() => setActiveMobileTab('chat')}
          style={{
            background: 'none', border: 'none', color: activeMobileTab === 'chat' ? '#8B5CF6' : '#94A3B8',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
            flex: 1
          }}>
          <ChatBubbleIcon />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Chat</span>
        </button>
        <button 
          onClick={() => setActiveMobileTab('details')}
          style={{
            background: 'none', border: 'none', color: activeMobileTab === 'details' ? '#8B5CF6' : '#94A3B8',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer',
            flex: 1
          }}>
          <FileTextIcon />
          <span style={{ fontSize: 12, fontWeight: 600 }}>Detalles</span>
        </button>
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
        .p2p-chat-messages-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .p2p-chat-messages-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        .p2p-order-scroll-hidden {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .p2p-order-scroll-hidden::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        @media (max-width: 1400px) {
          .p2p-chat-layout {
            grid-template-columns: minmax(0, 1fr) minmax(280px, 380px) !important;
            min-height: calc(100dvh - 16px) !important;
          }
        }
        @media (max-width: 1200px) {
          .p2p-chat-layout {
            grid-template-columns: 1fr !important;
            grid-template-rows: 1fr auto !important;
            height: calc(100dvh - 16px) !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
          .mobile-bottom-nav {
            display: flex !important;
          }
          .p2p-order-panel {
            overflow: auto !important;
            height: 100% !important;
            min-height: 0 !important;
          }
          .p2p-chat-panel {
            min-height: 0 !important;
            height: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
