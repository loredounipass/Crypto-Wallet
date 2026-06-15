import React, { useState, useEffect } from "react";

const Noticias = () => {
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

  const newsData = [
    {
      title: "Bitcoin supera los $100,000 por primera vez",
      summary: "El precio de Bitcoin alcanzó un nuevo máximo histórico, consolidando su posición como el activo digital más valioso del mercado.",
      date: "14 Jun 2026",
      tag: "Bitcoin",
      tagColor: "#F7931A",
    },
    {
      title: "Ethereum 3.0: La próxima gran actualización",
      summary: "La red Ethereum anuncia mejoras significativas en escalabilidad y reducción de costos de gas para su próxima versión.",
      date: "13 Jun 2026",
      tag: "Ethereum",
      tagColor: "#627EEA",
    },
    {
      title: "Regulación cripto avanza en Latinoamérica",
      summary: "Varios países de la región implementan nuevos marcos regulatorios que favorecen la adopción de criptomonedas.",
      date: "12 Jun 2026",
      tag: "Regulación",
      tagColor: "#10B981",
    },
    {
      title: "DeFi: Nuevas oportunidades de rendimiento",
      summary: "Los protocolos de finanzas descentralizadas ofrecen nuevas estrategias de staking y farming con rendimientos competitivos.",
      date: "11 Jun 2026",
      tag: "DeFi",
      tagColor: "#8B5CF6",
    },
    {
      title: "Solana lanza su ecosistema de pagos móviles",
      summary: "La red Solana presenta una nueva plataforma para pagos instantáneos con criptomonedas desde dispositivos móviles.",
      date: "10 Jun 2026",
      tag: "Solana",
      tagColor: "#14F195",
    },
    {
      title: "Stablecoins: El futuro de las transferencias internacionales",
      summary: "Las monedas estables se posicionan como la alternativa más eficiente para enviar remesas y realizar pagos transfronterizos.",
      date: "9 Jun 2026",
      tag: "Stablecoins",
      tagColor: "#2186EB",
    },
  ];

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
        Noticias
      </h1>
      <p style={{ color: "#9CA3AF", fontSize: "14px", margin: 0, marginBottom: "32px" }}>
        Mantente al día con las últimas noticias del mundo cripto.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {newsData.map((news, index) => (
          <div
            key={index}
            style={{
              background: "linear-gradient(180deg, #131327 0%, #0C0C17 100%)",
              borderRadius: "16px",
              padding: isMobile ? "16px" : "24px",
              border: "1px solid #1F1F33",
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              cursor: "pointer",
              transition: "border-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#2D2D50";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#1F1F33";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span
                style={{
                  background: `${news.tagColor}20`,
                  color: news.tagColor,
                  padding: "4px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {news.tag}
              </span>
              <span style={{ color: "#6B7280", fontSize: "12px" }}>{news.date}</span>
            </div>
            <h3
              style={{
                color: "#FFFFFF",
                fontSize: isMobile ? "15px" : "18px",
                fontWeight: 600,
                margin: "0 0 8px 0",
                lineHeight: 1.4,
              }}
            >
              {news.title}
            </h3>
            <p style={{ color: "#9CA3AF", fontSize: isMobile ? "13px" : "14px", margin: 0, lineHeight: 1.6 }}>
              {news.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Noticias;
