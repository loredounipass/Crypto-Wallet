import React from "react";
import { MessageContent } from "./MessageContent";
import { renderMarkdown } from "./renderMarkdown";

export function BrivoAgentChat({
  messages,
  isLoading,
  isTyping,
  chatContainerRef,
  messagesEndRef,
  handleSend,
  inputRef,
  inputText,
  setInputText,
  handleKeyDown,
  t,
  cancelResponse
}) {
  return (
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
          <div className="brivo-msg" style={{ display: "flex", gap: "8px", paddingLeft: "36px" }}>
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
            placeholder={t('brivo_placeholder')} disabled={isLoading || isTyping} style={{
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
  );
}
