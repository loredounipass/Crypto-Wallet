import React from "react";
import { IconButton } from "../../ui/material";

export function BrivoHeader({ mode, t, toggleChat }) {
  return (
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
            {mode === "human" ? t('brivo_tab_support') : t('brivo_title')}
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
  );
}
