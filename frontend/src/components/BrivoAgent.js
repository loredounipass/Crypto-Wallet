import React, { useState, useRef, useEffect } from "react";
import { Box, IconButton } from "../ui/material";
import useSupport from "../hooks/useSupport";

function parseMessage(text) {
  const parts = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", language: match[1], content: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }
  return parts.length ? parts : [{ type: "text", content: text }];
}

function MessageContent({ text }) {
  const parts = parseMessage(text);
  return parts.map((part, i) => {
    if (part.type === "code") {
      return (
        <div
          key={i}
          style={{
            margin: "8px 0",
            background: "#0D1117",
            borderRadius: "8px",
            border: "1px solid #30363D",
            overflow: "hidden",
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
            fontSize: "12px",
          }}
        >
          {part.language && (
            <div
              style={{
                padding: "6px 12px",
                background: "#161B22",
                borderBottom: "1px solid #30363D",
                color: "#8B949E",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {part.language}
            </div>
          )}
          <pre
            style={{
              margin: 0,
              padding: "12px",
              color: "#E6EDF3",
              lineHeight: 1.5,
              overflowX: "auto",
              whiteSpace: "pre",
            }}
          >
            <code>{part.content}</code>
          </pre>
        </div>
      );
    }
    return (
      <span key={i} className="brivo-msg-text">
        {part.content}
      </span>
    );
  });
}

const BrivoAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const { messages, isLoading, isTyping, sendMessage, cancelResponse } = useSupport();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isOpen) setMode(null);
  }, [isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const handleHuman = () => {
    setMode("human");
  };

  const handleAgent = () => {
    setMode("agent");
  };

  const handleBack = () => {
    setMode(null);
  };

  return (
    <>
      <style>{`
        @keyframes brivoFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes brivoSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes brivoPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .brivo-option-btn {
          border: none;
          border-radius: 12px;
          padding: 14px 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .brivo-option-btn:hover {
          transform: translateY(-2px);
        }
        .brivo-option-btn:active {
          transform: translateY(0);
        }
        .brivo-fade-in {
          animation: brivoFadeIn 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) both;
        }
        .brivo-slide-up {
          animation: brivoSlideUp 0.5s cubic-bezier(0.165, 0.84, 0.44, 1) both;
        }
        .brivo-delay-1 { animation-delay: 0.1s; }
        .brivo-delay-2 { animation-delay: 0.25s; }
        .brivo-msg-text {
          white-space: pre-wrap;
          word-break: break-word;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.5;
        }
      `}</style>

      {/* Floating Button */}
      <Box
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
        }}
      >
        <button
          onClick={toggleChat}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #2186EB, #8B5CF6)",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(33, 134, 235, 0.4)",
            transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            transform: isOpen ? "scale(0) rotate(90deg)" : "scale(1) rotate(0deg)",
            opacity: isOpen ? 0 : 1,
            pointerEvents: isOpen ? "none" : "auto",
            color: "#FFFFFF"
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </button>
      </Box>

      {/* Chat Window */}
      <Box
        style={{
          position: "fixed",
          bottom: isOpen ? "24px" : "0px",
          right: "24px",
          width: "350px",
          height: "500px",
          maxHeight: "calc(100vh - 48px)",
          background: "linear-gradient(180deg, #131327 0%, #0C0C17 100%)",
          borderRadius: "16px",
          border: "1px solid #1F1F33",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05)",
          display: "flex",
          flexDirection: "column",
          zIndex: 10000,
          transition: "all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
          transform: isOpen ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          overflow: "hidden",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        }}
      >
        {/* Header */}
        <Box
          style={{
            padding: "16px",
            borderBottom: "1px solid #1A1A2E",
            background: "linear-gradient(90deg, rgba(33, 134, 235, 0.1), rgba(139, 92, 246, 0.05))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #2186EB, #8B5CF6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8" />
                <rect width="16" height="12" x="4" y="8" rx="2" />
                <path d="M2 14h2" />
                <path d="M20 14h2" />
                <path d="M15 13v2" />
                <path d="M9 13v2" />
              </svg>
            </div>
            <div>
              <h3 style={{ color: "#FFF", fontSize: "15px", fontWeight: 600, margin: 0 }}>
                {mode === "human" ? "Soporte Humano" : "Brivo Agent"}
              </h3>
              <p style={{ color: "#10B981", fontSize: "11px", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }}></span>
                {mode === "human" ? "No disponible" : "En línea"}
              </p>
            </div>
          </div>
          <IconButton 
            onClick={toggleChat}
            style={{ color: "#8F95A3" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </IconButton>
        </Box>

        {/* Body */}
        {mode === null && (
          <Box
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "24px 20px",
              textAlign: "center",
            }}
          >
            <div className="brivo-fade-in" style={{ marginBottom: "8px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #2186EB, #8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFF",
                margin: "0 auto 12px"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M2 14h2" />
                  <path d="M20 14h2" />
                  <path d="M15 13v2" />
                  <path d="M9 13v2" />
                </svg>
              </div>
              <h3 style={{ color: "#FFF", fontSize: "16px", fontWeight: 600, margin: "0 0 4px" }}>
                ¡Hola! ¿Con quién deseas hablar?
              </h3>
              <p style={{ color: "#8F95A3", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
                Elige una opción para comenzar
              </p>
            </div>

            <div className="brivo-slide-up brivo-delay-1" style={{ width: "100%", marginTop: "20px" }}>
              <button
                className="brivo-option-btn"
                onClick={handleAgent}
                style={{
                  background: "linear-gradient(135deg, #2186EB, #8B5CF6)",
                  color: "#FFF",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M2 14h2" />
                  <path d="M20 14h2" />
                  <path d="M15 13v2" />
                  <path d="M9 13v2" />
                </svg>
                Hablar con Brivo Agent
              </button>
            </div>

            <div className="brivo-slide-up brivo-delay-2" style={{ width: "100%", marginTop: "10px" }}>
              <button
                className="brivo-option-btn"
                onClick={handleHuman}
                style={{
                  background: "#1F1F33",
                  color: "#E2E8F0",
                  border: "1px solid #2A2A40",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Hablar con Humano
              </button>
            </div>
          </Box>
        )}

        {mode === "human" && (
          <Box
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "24px 20px",
              textAlign: "center",
            }}
          >
            <div className="brivo-fade-in">
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#1F1F33",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8F95A3",
                margin: "0 auto 12px"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3 style={{ color: "#FFF", fontSize: "15px", fontWeight: 600, margin: "0 0 8px" }}>
                Soporte Humano
              </h3>
              <p style={{ color: "#8F95A3", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
                Lo sentimos, el soporte humano no está disponible en este momento.<br />
                Por favor, intenta más tarde o usa Brivo Agent.
              </p>
              <button
                onClick={handleBack}
                style={{
                  marginTop: "16px",
                  background: "transparent",
                  border: "1px solid #2A2A40",
                  borderRadius: "10px",
                  padding: "10px 24px",
                  color: "#2186EB",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(33,134,235,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                Volver
              </button>
            </div>
          </Box>
        )}

        {mode === "agent" && (
          <>
            {/* Messages */}
            <Box
              className="hide-scrollbar"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className="brivo-fade-in"
                  style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    background: msg.sender === "user" ? "linear-gradient(135deg, #2186EB, #1A6FCC)" : "#1F1F33",
                    color: "#FFF",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    borderBottomRightRadius: msg.sender === "user" ? "4px" : "12px",
                    borderBottomLeftRadius: msg.sender === "agent" ? "4px" : "12px",
                    fontSize: "13px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}
                >
                  <MessageContent text={msg.text} />
                </div>
              ))}
              {(isLoading || isTyping) && (
                <div
                  className="brivo-fade-in"
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "85%",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#1F1F33",
                    color: "#8F95A3",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    borderBottomLeftRadius: "4px",
                    fontSize: "13px",
                    fontStyle: "italic"
                  }}
                >
                  <span>Escribiendo</span>
                  <span style={{ display: "inline-flex", gap: "3px" }}>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#8F95A3", animation: "brivoPulse 1.4s infinite" }}></span>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#8F95A3", animation: "brivoPulse 1.4s infinite 0.2s" }}></span>
                    <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#8F95A3", animation: "brivoPulse 1.4s infinite 0.4s" }}></span>
                  </span>

                </div>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box
              style={{
                padding: "12px 16px",
                borderTop: "1px solid #1A1A2E",
                background: "#080811",
              }}
            >
              <form onSubmit={handleSend} style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  style={{
                    width: "100%",
                    background: "#131327",
                    border: "1px solid #1F1F33",
                    borderRadius: "24px",
                    padding: "12px 48px 12px 16px",
                    color: "#E2E8F0",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#2186EB"}
                  onBlur={(e) => e.target.style.borderColor = "#1F1F33"}
                />
                {isTyping ? (
                  <button
                    type="button"
                    onClick={cancelResponse}
                    title="Detener"
                    style={{
                      position: "absolute",
                      right: "4px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "none",
                      color: "#EF4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2"></rect>
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    style={{
                      position: "absolute",
                      right: "4px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: inputText.trim() ? "linear-gradient(135deg, #2186EB, #8B5CF6)" : "transparent",
                      border: "none",
                      color: inputText.trim() ? "#FFF" : "#6B7280",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: inputText.trim() ? "pointer" : "default",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: inputText.trim() ? "-2px" : "0" }}>
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                )}
              </form>
            </Box>
          </>
        )}
      </Box>
    </>
  );
};

export default BrivoAgent;
