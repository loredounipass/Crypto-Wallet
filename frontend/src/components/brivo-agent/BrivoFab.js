import React from "react";
import { Box } from "../../ui/material";

export function BrivoFab({ isOpen, toggleChat, handleDismiss }) {
  return (
    <Box className="brivo-fab" style={{ position: "fixed", bottom: "80px", right: "24px", zIndex: 9999 }}>
      <div style={{ position: "relative" }}>
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
        <button onClick={handleDismiss} style={{
          position: "absolute", top: "-4px", right: "-4px", width: "20px", height: "20px", borderRadius: "50%",
          background: "#1A1A2E", border: "1px solid #2D2D44", color: "#64748B", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
          fontSize: "12px", lineHeight: 1, zIndex: 1,
        }} title="Ocultar">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </Box>
  );
}
