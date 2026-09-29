import React from "react";

export function BrivoModeSelector({ handleModeSelect }) {
  return (
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
  );
}
