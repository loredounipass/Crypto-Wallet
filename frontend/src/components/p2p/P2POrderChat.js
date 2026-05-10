import React, { useState, useEffect, useContext, useCallback } from 'react';
// Force Webpack recompile
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';
import useEscrow from '../../hooks/useEscrow';
import useMessagesAndMultimedia from '../../hooks/useMessagesAndMultimedia';
import { useSocket } from '../../hooks/SocketContext';
import P2PDisputeModal from './P2PDisputeModal';
import { ChatBubbleIcon, FileTextIcon } from './ChatIcons';

import P2POrderDetailsPanel from './P2POrderDetailsPanel';
import P2PChatMessagesList from './P2PChatMessagesList';
import P2PChatInputArea from './P2PChatInputArea';
import P2PChatHeader from './P2PChatHeader';
import useP2PAudioRecorder from '../../hooks/useP2PAudioRecorder';
import useCounterpart from '../../hooks/useCounterpart';
import useP2PChatState from '../../hooks/useP2PChatState';

export default function P2POrderChat() {
  const { orderId } = useParams();
  const { auth } = useContext(AuthContext);
  
  
  const { currentOrder, getOrder, confirmPayment, releaseFunds, openDispute, cancelOrder, isLoading } = useEscrow();
  const { messages: allMessages, fetchMyMessages, createMessage, uploadMessage, joinChat, apiOrigin } = useMessagesAndMultimedia();

  const [showDispute, setShowDispute] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [activeMobileTab, setActiveMobileTab] = useState('chat'); // 'chat' | 'details'

  const { socket } = useSocket();

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

  const { counterpartId, counterpartUser, counterpartError } = useCounterpart(counterpartEmail);

  const formatName = (name) => {
    if (!name) return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const counterpartName = counterpartUser?.firstName 
    ? formatName(`${counterpartUser.firstName} ${counterpartUser.lastName || ''}`.trim()) 
    : counterpartEmail;

  // Join socket room and fetch initial messages when counterpart is known
  useEffect(() => {
    if (counterpartId && auth?._id) {
      joinChat(counterpartId);
      fetchMyMessages();
    }
  }, [counterpartId, auth?._id, joinChat, fetchMyMessages]);

  const chatState = useP2PChatState({
    socket,
    authId: auth?._id,
    counterpartId,
    allMessages,
    fetchMyMessages,
    createMessage,
    uploadMessage
  });

  const {
    messages,
    messageContent,
    setMessageContent,
    selectedFile,
    setSelectedFile,
    chatError,
    setChatError,
    isCounterpartTyping,
    fileInputRef,
    messagesEndRef,
    typingTimeoutRef,
    isCurrentlyTypingRef,
    handleSendMessage,
    handleSendAudio
  } = chatState;

  const { isRecording, recordingTime, startRecording, stopRecording } = useP2PAudioRecorder(
    handleSendAudio, 
    setChatError
  );

  const displayError = chatError || counterpartError;

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
        <P2PChatHeader 
          borderColor={borderColor} 
          counterpartName={counterpartName}
          isProvider={isProvider}
          isSeller={isSeller}
        />

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
          maxWidth: 900,
          margin: '0 auto',
          width: '100%',
          }}>
          <P2PChatMessagesList
            messages={messages}
            authId={auth?._id}
            counterpartName={counterpartName}
            apiOrigin={apiOrigin}
            messagesEndRef={messagesEndRef}
            borderColor={borderColor}
          />
          </div>
        </div>

        {/* Typing indicator - centered below chat */}
        <div style={{ 
          minHeight: 24, display: 'flex', justifyContent: 'center', alignItems: 'center',
          backgroundColor: '#0F0F1A',
          borderTop: isCounterpartTyping ? 'none' : 'none',
        }}>
          {isCounterpartTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0' }}>
              <style>
                {`
                  @keyframes typingDot {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-3px); opacity: 1; }
                  }
                `}
              </style>
              <span style={{ fontSize: 12, color: '#FFFFFF', fontWeight: 500 }}>escribiendo</span>
              <div style={{ display: 'flex', gap: 3, alignItems: 'center', marginLeft: 2 }}>
                <div style={{ width: 4, height: 4, backgroundColor: '#FFFFFF', borderRadius: '50%', animation: 'typingDot 1.4s infinite ease-in-out both' }} />
                <div style={{ width: 4, height: 4, backgroundColor: '#FFFFFF', borderRadius: '50%', animation: 'typingDot 1.4s infinite ease-in-out both', animationDelay: '0.2s' }} />
                <div style={{ width: 4, height: 4, backgroundColor: '#FFFFFF', borderRadius: '50%', animation: 'typingDot 1.4s infinite ease-in-out both', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <P2PChatInputArea
          isRecording={isRecording}
          recordingTime={recordingTime}
          stopRecording={stopRecording}
          startRecording={startRecording}
          messageContent={messageContent}
          setMessageContent={setMessageContent}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
          fileInputRef={fileInputRef}
          handleSendMessage={handleSendMessage}
          socket={socket}
          counterpartId={counterpartId}
          isCurrentlyTypingRef={isCurrentlyTypingRef}
          typingTimeoutRef={typingTimeoutRef}
          borderColor={borderColor}
          chatError={displayError}
        />
      </div>

      {/* RIGHT: Order Panel */}
      <P2POrderDetailsPanel 
        activeMobileTab={activeMobileTab}
        currentOrder={currentOrder}
        isProvider={isProvider}
        isSeller={isSeller}
        actionLoading={actionLoading}
        handleAction={handleAction}
        setShowDispute={setShowDispute}
        authEmail={auth?.email}
        counterpartName={counterpartName}
      />

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
