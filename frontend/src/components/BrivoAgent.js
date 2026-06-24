import React, { useState, useRef, useEffect, useCallback } from "react";
import { Box, IconButton } from "../ui/material";
import useSupport from "../hooks/useSupport";

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let listItems = [];
  let tableRows = [];
  let inTable = false;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: "6px 0", paddingLeft: "20px", listStyleType: "disc", color: "#E2E8F0", fontSize: "13px", lineHeight: 1.6 }}>
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} style={{ margin: "8px 0", overflowX: "auto", border: "1px solid #2D2D44", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <tbody>
              {tableRows.map((row, rIdx) => {
                const isHeader = rIdx === 0;
                const isSeparator = row.every(cell => cell.includes("---"));
                if (isSeparator) return null;
                return (
                  <tr key={rIdx} style={{ borderBottom: rIdx < tableRows.length - 1 ? "1px solid #2D2D44" : "none", background: isHeader ? "#1A1A2E" : "transparent" }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: "6px 10px", fontWeight: isHeader ? 600 : 400, color: isHeader ? "#2186EB" : "#E2E8F0" }}>
                        {formatInline(cell.trim(), `${rIdx}-${cIdx}`)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  const formatInline = (line, keyPrefix) => {
    let result = [];
    let keyIdx = 0;
    const partsBold = line.split(/(\*\*.*?\*\*)/);
    partsBold.forEach(part => {
      if (part.startsWith("**") && part.endsWith("**")) {
        result.push(<strong key={`${keyPrefix}-b-${keyIdx++}`} style={{ fontWeight: 600, color: "#8B5CF6" }}>{part.slice(2, -2)}</strong>);
      } else {
        const partsItalic = part.split(/(\*.*?\*)/);
        partsItalic.forEach(subPart => {
          if (subPart.startsWith("*") && subPart.endsWith("*") && subPart.length > 2) {
            result.push(<em key={`${keyPrefix}-i-${keyIdx++}`} style={{ fontStyle: "italic", color: "#94A3B8" }}>{subPart.slice(1, -1)}</em>);
          } else if (subPart) {
            result.push(subPart);
          }
        });
      }
    });
    return result.length > 0 ? result : line;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      inTable = true;
      const cells = trimmed.split("|").slice(1, -1);
      tableRows.push(cells);
      return;
    } else if (inTable) {
      flushTable();
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(<div key={i} style={{ fontWeight: 600, fontSize: "14px", color: "#F1F5F9", marginTop: "10px", marginBottom: "4px" }}>{formatInline(trimmed.slice(4), i)}</div>);
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(<div key={i} style={{ fontWeight: 700, fontSize: "15px", color: "#FFF", marginTop: "12px", marginBottom: "6px", borderBottom: "1px solid #2D2D44", paddingBottom: "4px" }}>{formatInline(trimmed.slice(3), i)}</div>);
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(<div key={i} style={{ fontWeight: 700, fontSize: "16px", color: "#FFF", marginTop: "12px", marginBottom: "6px" }}>{formatInline(trimmed.slice(2), i)}</div>);
    } else if (/^[-*•]\s/.test(trimmed)) {
      listItems.push(<li key={i} style={{ color: "#E2E8F0" }}>{formatInline(trimmed.replace(/^[-*•]\s/, ""), i)}</li>);
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList();
      const num = trimmed.match(/^\d+\./)[0];
      const rest = trimmed.replace(/^\d+\.\s/, "");
      elements.push(
        <div key={i} style={{ display: "flex", gap: "6px", margin: "2px 0" }}>
          <span style={{ color: "#2186EB", fontWeight: 600, flexShrink: 0 }}>{num}</span>
          <span style={{ color: "#E2E8F0" }}>{formatInline(rest, i)}</span>
        </div>
      );
    } else if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <div key={i} style={{ padding: "6px 10px", margin: "6px 0", borderLeft: "3px solid #8B5CF6", background: "rgba(139, 92, 246, 0.06)", borderRadius: "0 6px 6px 0", color: "#94A3B8", fontStyle: "italic", fontSize: "13px" }}>
          {formatInline(trimmed.slice(2), i)}
        </div>
      );
    } else if (trimmed === "") {
      flushList();
      elements.push(<div key={i} style={{ height: "6px" }} />);
    } else {
      flushList();
      elements.push(<p key={i} style={{ color: "#E2E8F0", margin: "3px 0", lineHeight: 1.6, fontSize: "13px" }}>{formatInline(trimmed, i)}</p>);
    }
  });
  flushList();
  flushTable();
  return elements;
}

function CodeBlock({ language, content }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content]);

  return (
    <div style={{
      margin: "8px 0",
      background: "#0D1117",
      borderRadius: "8px",
      border: "1px solid #30363D",
      overflow: "hidden",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      fontSize: "12px",
    }}>
      <div style={{
        padding: "6px 12px",
        background: "#161B22",
        borderBottom: "1px solid #30363D",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ color: "#8B949E", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {language || "code"}
        </span>
        <button onClick={handleCopy} style={{
          background: "transparent",
          border: "none",
          color: copied ? "#3FB950" : "#8B949E",
          cursor: "pointer",
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "11px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          transition: "color 0.2s",
        }}
          onMouseEnter={(e) => e.currentTarget.style.color = "#E6EDF3"}
          onMouseLeave={(e) => e.currentTarget.style.color = copied ? "#3FB950" : "#8B949E"}
        >
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          )}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: "12px",
        color: "#E6EDF3",
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-all",
        overflow: "hidden",
      }}>
        <code>{content}</code>
      </pre>
    </div>
  );
}

const BrivoAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const { messages, isLoading, isTyping, sendMessage, cancelResponse } = useSupport();

  const scrollToBottom = () => {
    const container = chatContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleChat = () => {
    const nextIsOpen = !isOpen;
    setIsOpen(nextIsOpen);
    if (!nextIsOpen) {
      setMode(null);
    } else {
      setTimeout(() => {
        scrollToBottom();
        if (mode === "agent") {
          inputRef.current?.focus();
        }
      }, 50);
    }
  };

  const handleModeSelect = (m) => {
    setMode(m);
    setTimeout(() => {
      scrollToBottom();
      if (m === "agent") {
        inputRef.current?.focus();
      }
    }, 50);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || isTyping) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };


  const handleBack = () => setMode(null);

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
      `}</style>

      {/* Floating Button */}
      <Box style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 9999 }}>
        <button onClick={toggleChat} style={{
          width: "56px", height: "56px", borderRadius: "50%",
          background: "linear-gradient(135deg, #2186EB, #8B5CF6)",
          border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 24px rgba(33, 134, 235, 0.4)",
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: isOpen ? "scale(0) rotate(90deg)" : "scale(1) rotate(0deg)",
          opacity: isOpen ? 0 : 1, pointerEvents: isOpen ? "none" : "auto", color: "#FFF"
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
          </svg>
        </button>
      </Box>

      {/* Chat Window */}
      <Box style={{
        position: "fixed", bottom: isOpen ? "24px" : "0", right: "24px",
        width: "380px", height: "540px", maxHeight: "calc(100vh - 48px)",
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
        {/* Header */}
        <div style={{
          padding: "14px 16px", borderBottom: "1px solid #2D2D44",
          background: "#1A1A2E",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "34px", height: "34px", borderRadius: "10px",
              background: "linear-gradient(135deg, #2186EB, #8B5CF6)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF"
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
              </svg>
            </div>
            <div>
              <div style={{ color: "#FFF", fontSize: "14px", fontWeight: 600 }}>
                {mode === "human" ? "Soporte Humano" : "Brivo Agent"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "1px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: mode === "human" ? "#6B7280" : "#10B981" }}></span>
                <span style={{ color: mode === "human" ? "#6B7280" : "#10B981", fontSize: "11px" }}>
                  {mode === "human" ? "No disponible" : "En linea"}
                </span>
              </div>
            </div>
          </div>
          <IconButton onClick={toggleChat} style={{ color: "#64748B", padding: "4px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </IconButton>
        </div>

        {/* Mode Selection Screen */}
        {mode === null && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "32px 24px", textAlign: "center" }}>
            <div className="brivo-fade-in">
              <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "linear-gradient(135deg, #2186EB, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", margin: "0 auto 14px" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                </svg>
              </div>
              <h3 style={{ color: "#FFF", fontSize: "16px", fontWeight: 600, margin: "0 0 4px" }}>Hola! Con quien deseas hablar?</h3>
              <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>Elige una opcion para comenzar</p>
            </div>

            <div className="brivo-slide-up brivo-delay-1" style={{ width: "100%", marginTop: "24px" }}>
              <button onClick={() => handleModeSelect("agent")} style={{
                width: "100%", border: "none", borderRadius: "12px", padding: "14px 20px", cursor: "pointer",
                fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "12px",
                background: "linear-gradient(135deg, #2186EB, #8B5CF6)", color: "#FFF",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                </svg>
                Hablar con Brivo Agent
              </button>
            </div>

            <div className="brivo-slide-up brivo-delay-2" style={{ width: "100%", marginTop: "10px" }}>
              <button onClick={() => handleModeSelect("human")} style={{
                width: "100%", borderRadius: "12px", padding: "14px 20px", cursor: "pointer",
                fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "12px",
                background: "#1A1A2E", color: "#E2E8F0", border: "1px solid #2D2D44",
                transition: "transform 0.2s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                </svg>
                Hablar con Humano
              </button>
            </div>
          </div>
        )}

        {/* Human Mode */}
        {mode === "human" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "32px 24px", textAlign: "center" }}>
            <div className="brivo-fade-in">
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#1A1A2E", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", margin: "0 auto 12px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <h3 style={{ color: "#FFF", fontSize: "15px", fontWeight: 600, margin: "0 0 8px" }}>Soporte Humano</h3>
              <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
                Lo sentimos, el soporte humano no esta disponible en este momento.<br />
                Por favor, intenta mas tarde o usa Brivo Agent.
              </p>
              <button onClick={handleBack} style={{
                marginTop: "16px", background: "transparent", border: "1px solid #2D2D44",
                borderRadius: "10px", padding: "10px 24px", color: "#2186EB",
                cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "background 0.2s"
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(33,134,235,0.1)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >Volver</button>
            </div>
          </div>
        )}

        {/* Agent Chat */}
        {mode === "agent" && (
          <>
            <div ref={chatContainerRef} className="hide-scrollbar" style={{
              flex: 1, overflowY: "auto", overflowX: "hidden", padding: "16px",
              display: "flex", flexDirection: "column", gap: "12px",
            }}>
              {messages.length === 1 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "20px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "linear-gradient(135deg, #2186EB, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", margin: "0 auto 12px" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                    </svg>
                  </div>
                  <p style={{ color: "#94A3B8", fontSize: "12px", margin: 0 }}>En que puedo ayudarte hoy?</p>
                  <p style={{ color: "#64748B", fontSize: "11px", marginTop: "4px" }}>Escribe tu mensaje para comenzar</p>
                </div>
              )}
              {messages.slice(1).map((msg, idx) => (
                <div key={idx} className="brivo-msg" style={{ display: "flex", gap: "8px", flexDirection: msg.sender === "user" ? "row-reverse" : "row" }}>
                  {msg.sender === "agent" && (
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #2186EB, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", flexShrink: 0, marginTop: "2px" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                      </svg>
                    </div>
                  )}
                  <div style={{
                    maxWidth: msg.sender === "user" ? "80%" : "86%",
                    padding: msg.sender === "user" ? "10px 14px" : "8px 0",
                    borderRadius: msg.sender === "user" ? "14px 14px 4px 14px" : "0",
                    background: msg.sender === "user" ? "linear-gradient(135deg, #2186EB, #1A6FCC)" : "transparent",
                    color: "#FFF", fontSize: "13px",
                    wordBreak: "break-word", overflowX: "hidden"
                  }}>
                    {msg.sender === "user" ? (
                      <span style={{ lineHeight: 1.5 }}>{msg.text}</span>
                    ) : (
                      <div>
                        {msg.text.includes("```") ? (
                          <MessageContent text={msg.text} />
                        ) : (
                          renderMarkdown(msg.text)
                        )}
                      </div>
                    )}
                  </div>

                </div>
              ))}
              {(isLoading || isTyping) && (
                <div className="brivo-msg" style={{ display: "flex", gap: "8px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg, #2186EB, #8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", flexShrink: 0, marginTop: "2px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
                    </svg>
                  </div>
                  <div style={{ padding: "8px 0" }}>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2186EB", animation: "brivoPulse 1.4s infinite" }}></span>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2186EB", animation: "brivoPulse 1.4s infinite 0.2s" }}></span>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2186EB", animation: "brivoPulse 1.4s infinite 0.4s" }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: "12px 16px", borderTop: "1px solid #2D2D44", background: "#0F0F1A" }}>
              <form onSubmit={handleSend} style={{ position: "relative", display: "flex", alignItems: "center", background: "#1A1A2E", border: "1px solid #2D2D44", borderRadius: "12px", padding: "4px 4px 4px 14px" }}>
                <input ref={inputRef} type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Escribe tu mensaje..." disabled={isLoading || isTyping} style={{
                    flex: 1, background: "transparent", border: "none", color: "#E2E8F0",
                    fontSize: "13px", outline: "none", padding: "8px 0", fontFamily: "inherit",
                  }}
                />
                {isTyping ? (
                  <button type="button" onClick={cancelResponse} title="Detener" style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: "rgba(239, 68, 68, 0.15)", border: "none", color: "#EF4444",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    transition: "all 0.2s", flexShrink: 0,
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>
                  </button>
                ) : (
                  <button type="submit" disabled={!inputText.trim()} style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: inputText.trim() ? "linear-gradient(135deg, #2186EB, #8B5CF6)" : "transparent",
                    border: "none", color: inputText.trim() ? "#FFF" : "#6B7280",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: inputText.trim() ? "pointer" : "default",
                    transition: "all 0.2s", flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                  </button>
                )}
              </form>
            </div>
          </>
        )}
      </Box>
    </>
  );
};

function MessageContent({ text }) {
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
  const items = parts.length ? parts : [{ type: "text", content: text }];

  return items.map((part, i) => {
    if (part.type === "code") {
      return <CodeBlock key={i} language={part.language} content={part.content} />;
    }
    return <span key={i}>{renderMarkdown(part.content)}</span>;
  });
}

export default BrivoAgent;
