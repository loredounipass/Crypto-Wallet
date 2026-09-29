import React from "react";

export function BrivoHumanMode({ handleBack }) {
  return (
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
  );
}
