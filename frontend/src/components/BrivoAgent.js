import React, { useState } from "react";
import { Box, IconButton } from "../ui/material";

const BrivoAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "¡Hola! Soy Brivo Agent, tu asistente virtual inteligente. ¿En qué puedo ayudarte hoy?", sender: "agent" }
  ]);
  const [inputText, setInputText] = useState("");

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    // Add user message
    setMessages([...messages, { text: inputText, sender: "user" }]);
    setInputText("");
    
    // Placeholder for future API integration
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "Por ahora estoy en modo de prueba, pronto podré responder a tus consultas gracias a la IA.", sender: "agent" }]);
    }, 1000);
  };

  return (
    <>
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
          overflow: "hidden"
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
              <h3 style={{ color: "#FFF", fontSize: "15px", fontWeight: 600, margin: 0 }}>Brivo Agent</h3>
              <p style={{ color: "#10B981", fontSize: "11px", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10B981" }}></span>
                En línea
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

        {/* Messages */}
        <Box
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
                lineHeight: 1.5,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
              }}
            >
              {msg.text}
            </div>
          ))}
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
          </form>
        </Box>
      </Box>
    </>
  );
};

export default BrivoAgent;
