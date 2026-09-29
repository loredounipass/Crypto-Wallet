import React from "react";
import { Box } from "../../ui/material";
import useBrivoAgentLogic from "./useBrivoAgentLogic";
import { BrivoFab } from "./BrivoFab";
import { BrivoHeader } from "./BrivoHeader";
import { BrivoModeSelector } from "./BrivoModeSelector";
import { BrivoHumanMode } from "./BrivoHumanMode";
import { BrivoAgentChat } from "./BrivoAgentChat";

const BrivoAgent = () => {
  const {
    t,
    isOpen,
    dismissed,
    mode,
    inputText,
    setInputText,
    messagesEndRef,
    chatContainerRef,
    inputRef,
    messages,
    isLoading,
    isTyping,
    cancelResponse,
    toggleChat,
    handleModeSelect,
    handleSend,
    handleKeyDown,
    handleBack,
    handleDismiss
  } = useBrivoAgentLogic();

  if (dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes brivoFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes brivoPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        @keyframes brivoSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .brivo-msg { animation: brivoFadeIn 0.3s ease both; }
        .brivo-fade-in { animation: brivoFadeIn 0.35s ease both; }
        .brivo-slide-up { animation: brivoSlideUp 0.4s ease both; }
        .brivo-delay-1 { animation-delay: 0.1s; }
        .brivo-delay-2 { animation-delay: 0.2s; }
        @media (max-width: 640px) {
          .brivo-fab { right: 16px !important; bottom: 80px !important; }
          .brivo-chat { width: calc(100vw - 32px) !important; right: 16px !important; top: 80px !important; bottom: 16px !important; max-height: none !important; height: auto !important; }
        }
      `}</style>

      <BrivoFab 
        isOpen={isOpen} 
        toggleChat={toggleChat} 
        handleDismiss={handleDismiss} 
      />

      {/* Chat Window */}
      <Box className="brivo-chat" style={{
        position: "fixed", top: "80px", right: "24px", bottom: "24px",
        width: "380px",
        background: "#0F0F1A", borderRadius: "16px",
        border: "1px solid #2D2D44",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4)",
        display: "flex", flexDirection: "column", zIndex: 10000,
        transition: "all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
        transform: isOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none",
        overflow: "hidden",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        
        <BrivoHeader 
          mode={mode} 
          t={t} 
          toggleChat={toggleChat} 
        />

        {mode === null && <BrivoModeSelector handleModeSelect={handleModeSelect} />}

        {mode === "human" && <BrivoHumanMode handleBack={handleBack} />}

        {mode === "agent" && (
          <BrivoAgentChat 
            messages={messages}
            isLoading={isLoading}
            isTyping={isTyping}
            chatContainerRef={chatContainerRef}
            messagesEndRef={messagesEndRef}
            handleSend={handleSend}
            inputRef={inputRef}
            inputText={inputText}
            setInputText={setInputText}
            handleKeyDown={handleKeyDown}
            t={t}
            cancelResponse={cancelResponse}
          />
        )}
      </Box>
    </>
  );
};

export default BrivoAgent;
