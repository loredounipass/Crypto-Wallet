import React, { useState, useEffect } from "react";

const Swap = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const containerStyle = {
    padding: isMobile ? "4px" : "32px",
    maxWidth: "960px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div style={containerStyle}>
      <h1
        style={{
          color: "#FFFFFF",
          fontWeight: 700,
          fontSize: isMobile ? "20px" : "32px",
          marginBottom: "8px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        Swap
      </h1>
      <p style={{ color: "#9CA3AF", fontSize: "14px", margin: 0, marginBottom: "32px" }}>
        Intercambia tus criptomonedas de forma rápida y segura.
      </p>

      <div
        style={{
          background: "linear-gradient(180deg, #131327 0%, #0C0C17 100%)",
          borderRadius: "16px",
          padding: isMobile ? "20px" : "32px",
          border: "1px solid #1F1F33",
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
        }}
      >
        {/* From */}
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <label style={{ color: "#9CA3AF", fontSize: "13px", marginBottom: "8px", display: "block" }}>Desde</label>
          <div
            style={{
              background: "#0A0A18",
              border: "1px solid #1F1F33",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <input
              type="number"
              placeholder="0.00"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "#FFFFFF",
                fontSize: "24px",
                fontWeight: 600,
                width: "60%",
              }}
            />
            <div
              style={{
                background: "#1F1F33",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#E2E8F0",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              BTC ▾
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)",
            transition: "transform 0.2s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "rotate(180deg)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 4v16" /><path d="M7 20l-4-4" /><path d="M7 20l4-4" />
            <path d="M17 20V4" /><path d="M17 4l-4 4" /><path d="M17 4l4 4" />
          </svg>
        </div>

        {/* To */}
        <div style={{ width: "100%", maxWidth: "440px" }}>
          <label style={{ color: "#9CA3AF", fontSize: "13px", marginBottom: "8px", display: "block" }}>Hacia</label>
          <div
            style={{
              background: "#0A0A18",
              border: "1px solid #1F1F33",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <input
              type="number"
              placeholder="0.00"
              style={{
                background: "none",
                border: "none",
                outline: "none",
                color: "#FFFFFF",
                fontSize: "24px",
                fontWeight: 600,
                width: "60%",
              }}
            />
            <div
              style={{
                background: "#1F1F33",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#E2E8F0",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ETH ▾
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <button
          style={{
            width: "100%",
            maxWidth: "440px",
            padding: "16px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
            color: "#FFFFFF",
            fontSize: "16px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(139, 92, 246, 0.3)",
            transition: "opacity 0.2s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Intercambiar
        </button>
      </div>
    </div>
  );
};

export default Swap;
