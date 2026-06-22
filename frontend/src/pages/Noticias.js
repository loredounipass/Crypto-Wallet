import React, { useState, useEffect, useMemo } from "react";
import useNews from "../hooks/useNews";

/* ─── Helpers ──────────────────────────────────────────────────── */

/** Garantiza que la URL sea absoluta y dirija al sitio externo */
const getArticleUrl = (article) => {
  if (article.url && article.url.startsWith("http")) return article.url;
  if (article.guid && article.guid.startsWith("http")) return article.guid;
  return `https://www.cryptocompare.com${article.url || ""}`;
};

/** Genera un degradado único basado en el ID o título del artículo */
const generateGradient = (seed) => {
  const gradients = [
    "linear-gradient(135deg, #F7931A40, #F59E0B90)", // Orange
    "linear-gradient(135deg, #627EEA40, #8B5CF690)", // Purple/Blue
    "linear-gradient(135deg, #14F19540, #06B6D490)", // Cyan/Green
    "linear-gradient(135deg, #EC489940, #EF444490)", // Pink/Red
    "linear-gradient(135deg, #8B5CF640, #3B82F690)", // Indigo/Blue
    "linear-gradient(135deg, #10B98140, #05966990)", // Emerald
  ];
  const str = String(seed);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  return gradients[Math.abs(hash) % gradients.length];
};

/** Genera un color consistente a partir del nombre de categoría */
const categoryColor = (cat) => {
  const palette = [
    "#F7931A", "#627EEA", "#14F195", "#8B5CF6",
    "#2186EB", "#10B981", "#EC4899", "#F59E0B",
    "#06B6D4", "#EF4444",
  ];
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

/** Formatea un timestamp UNIX a fecha legible */
const formatDate = (ts) => {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
};

/** Tiempo transcurrido (hace X min / h / d) */
const timeAgo = (ts) => {
  const diff = Math.floor((Date.now() / 1000) - ts);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
};

/* ─── Componente ────────────────────────────────────────────────── */

const Noticias = () => {
  /* ---- Responsive ---- */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ---- Filtros / Ordenamiento ---- */
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("latest");

  const options = useMemo(() => ({ sortOrder }), [sortOrder]);
  const { news, loading, error, refetch } = useNews(options);

  /* ---- Categorías extraídas de los datos ---- */
  const categories = useMemo(() => {
    const set = new Set();
    if (Array.isArray(news)) {
      news.forEach((n) => {
        (n.categories || "").split("|").forEach((c) => {
          if (c.trim()) set.add(c.trim());
        });
      });
    }
    return ["ALL", ...Array.from(set).slice(0, 8)];
  }, [news]);

  /* ---- Filtrado local ---- */
  const filtered = useMemo(() => {
    if (!Array.isArray(news)) return [];
    if (activeCategory === "ALL") return news;
    return news.filter((n) => (n.categories || "").includes(activeCategory));
  }, [news, activeCategory]);

  /* ---- Estilos ---- */
  const containerStyle = {
    padding: isMobile ? "16px" : "32px",
    maxWidth: "1280px", // Más ancho para la grilla
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  };

  const chipBase = {
    padding: "8px 16px",
    borderRadius: "24px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
    whiteSpace: "nowrap",
    userSelect: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={containerStyle}>
      {/* Estilos globales para efectos hover premium y grillas */}
      <style>{`
        .news-card {
          text-decoration: none;
          display: flex;
          flex-direction: column;
          background: #121220; /* Color de fondo sólido y premium */
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          height: 100%;
        }
        .news-card:hover {
          transform: translateY(-6px);
          border-color: rgba(139, 92, 246, 0.4); /* Resplandor sutil púrpura */
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(139, 92, 246, 0.15);
        }
        .news-img-container {
          width: 100%;
          aspect-ratio: 16 / 9; /* Relación de aspecto perfecta */
          overflow: hidden;
          position: relative;
          background: #1A1A2E;
        }
        .news-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
        }
        .news-card:hover .news-img {
          transform: scale(1.08); /* Zoom en imagen al hacer hover */
        }
        .news-content {
          padding: 24px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        .news-title {
          color: #F9FAFB;
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 12px 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          letter-spacing: -0.01em;
        }
        .news-body {
          color: #9CA3AF;
          font-size: 14px;
          margin: 0;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex-grow: 1;
        }
        .news-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 28px;
        }
        @media (max-width: 640px) {
          .news-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .news-content {
            padding: 16px;
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* -------- Header -------- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px", marginBottom: "32px" }}>
        <div>
          <h1
            style={{
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: isMobile ? "28px" : "40px",
              marginBottom: "8px",
              fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Noticias Crypto
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: "16px", margin: "4px 0 0" }}>
            Mantente al día con las últimas tendencias del mercado.
          </p>
        </div>

        {/* Selector orden + refetch */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select
            id="news-sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#E5E7EB",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              outline: "none",
              backdropFilter: "blur(10px)",
              transition: "border-color 0.2s",
            }}
            onMouseOver={(e) => e.target.style.borderColor = "rgba(255,255,255,0.2)"}
            onMouseOut={(e) => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
          >
            <option value="latest" style={{ background: "#1A1A2E" }}>Más recientes</option>
            <option value="popular" style={{ background: "#1A1A2E" }}>Más populares</option>
          </select>

          <button
            id="news-refresh-btn"
            onClick={refetch}
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#FFF",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "transform 0.1s, opacity 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseDown={(e) => { if (!loading) e.target.style.transform = "scale(0.96)"; }}
            onMouseUp={(e) => { if (!loading) e.target.style.transform = "scale(1)"; }}
            onMouseLeave={(e) => { if (!loading) e.target.style.transform = "scale(1)"; }}
          >
            {loading ? "Actualizando..." : "↻ Actualizar"}
          </button>
        </div>
      </div>

      {/* -------- Chips de categorías -------- */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "nowrap",
          marginBottom: "32px",
          overflowX: "auto",
          paddingBottom: "8px",
          WebkitOverflowScrolling: "touch",
          msOverflowStyle: "none",  /* IE and Edge */
          scrollbarWidth: "none",  /* Firefox */
        }}
      >
        <style>{`
          /* Ocultar scrollbar en los chips */
          div::-webkit-scrollbar { display: none; }
        `}</style>
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const color = cat === "ALL" ? "#8B5CF6" : categoryColor(cat);
          return (
            <span
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                ...chipBase,
                background: isActive ? `${color}25` : "rgba(255,255,255,0.03)",
                color: isActive ? color : "#9CA3AF",
                borderColor: isActive ? `${color}50` : "rgba(255,255,255,0.05)",
              }}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#E5E7EB";
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.color = "#9CA3AF";
                }
              }}
            >
              {cat === "ALL" ? "Todas las noticias" : cat}
            </span>
          );
        })}
      </div>

      {/* -------- Estado de carga / error -------- */}
      {loading && (
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              border: "3px solid rgba(139, 92, 246, 0.2)",
              borderTopColor: "#8B5CF6",
              borderRadius: "50%",
              margin: "0 auto 20px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "#9CA3AF", fontSize: "16px", fontWeight: 500 }}>Buscando las últimas noticias...</p>
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "48px",
            background: "rgba(239, 68, 68, 0.05)",
            borderRadius: "20px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚠️</div>
          <p style={{ color: "#F87171", fontWeight: 700, fontSize: "20px", margin: "0 0 12px" }}>Ocurrió un error</p>
          <p style={{ color: "#9CA3AF", fontSize: "15px", margin: "0 0 24px" }}>{error}</p>
          <button
            onClick={refetch}
            style={{
              background: "#EF4444",
              color: "#FFF",
              border: "none",
              borderRadius: "10px",
              padding: "10px 24px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "15px",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => e.target.style.background = "#DC2626"}
            onMouseOut={(e) => e.target.style.background = "#EF4444"}
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {/* -------- Lista de noticias (Grilla) -------- */}
      {!loading && !error && (
        <div className="news-grid">
          {filtered.length === 0 && (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "64px 0", color: "#6B7280" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.5 }}>📰</div>
              <p style={{ fontSize: "16px" }}>No se encontraron noticias para esta categoría.</p>
            </div>
          )}

          {filtered.map((article) => {
            const cats = (article.categories || "").split("|").filter(Boolean).slice(0, 2);

            return (
              <a
                key={article.id}
                href={getArticleUrl(article)}
                target="_blank"
                rel="noopener noreferrer"
                id={`news-article-${article.id}`}
                className="news-card"
              >
                {/* Contenedor de Imagen con Relación de Aspecto */}
                <div className="news-img-container">
                  {article.imageurl ? (
                    <img
                      src={article.imageurl}
                      alt={article.title}
                      className="news-img"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.style.background = generateGradient(article.id || article.title);
                      }}
                    />
                  ) : (
                    // Gradiente dinámico si no hay imagen en absoluto
                    <div style={{ 
                      width: "100%", 
                      height: "100%", 
                      background: generateGradient(article.id || article.title),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                       <span style={{ fontSize: "40px", opacity: 0.3 }}>📰</span>
                    </div>
                  )}

                  {/* Badge de fuente flotante */}
                  {article.source_info?.name && (
                    <div style={{
                      position: "absolute",
                      bottom: "12px",
                      left: "12px",
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(8px)",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      color: "#FFF",
                      fontSize: "11px",
                      fontWeight: 600,
                      border: "1px solid rgba(255,255,255,0.1)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      {article.source_info?.img && (
                        <img
                          src={article.source_info.img}
                          alt="source"
                          style={{ width: "14px", height: "14px", borderRadius: "50%" }}
                          onError={(e) => e.target.style.display = "none"}
                        />
                      )}
                      {article.source_info.name}
                    </div>
                  )}
                </div>

                <div className="news-content">
                  {/* Meta: Categorías + Fecha */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {cats.map((c) => (
                        <span
                          key={c}
                          style={{
                            background: `${categoryColor(c)}15`,
                            color: categoryColor(c),
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            letterSpacing: "0.02em",
                            textTransform: "uppercase"
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>

                    <span style={{ color: "#6B7280", fontSize: "12px", fontWeight: 500 }} title={formatDate(article.published_on)}>
                      {timeAgo(article.published_on)}
                    </span>
                  </div>

                  {/* Título */}
                  <h3 className="news-title">
                    {article.title}
                  </h3>

                  {/* Extracto */}
                  <p className="news-body">
                    {article.body}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Noticias;

