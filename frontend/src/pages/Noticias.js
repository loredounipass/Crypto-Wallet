import React, { useState, useEffect, useMemo } from "react";
import useNews from "../hooks/useNews";

/* ─── Helpers ──────────────────────────────────────────────────── */

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
  if (diff < 60)   return `hace ${diff}s`;
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
    news.forEach((n) => {
      (n.categories || "").split("|").forEach((c) => {
        if (c.trim()) set.add(c.trim());
      });
    });
    return ["ALL", ...Array.from(set).slice(0, 8)];
  }, [news]);

  /* ---- Filtrado local ---- */
  const filtered = useMemo(() => {
    if (activeCategory === "ALL") return news;
    return news.filter((n) => (n.categories || "").includes(activeCategory));
  }, [news, activeCategory]);

  /* ---- Estilos ---- */
  const containerStyle = {
    padding: isMobile ? "4px" : "32px",
    maxWidth: "960px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  };

  const chipBase = {
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
    userSelect: "none",
  };

  return (
    <div style={containerStyle}>
      {/* -------- Header -------- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
        <div>
          <h1
            style={{
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: isMobile ? "20px" : "32px",
              marginBottom: "4px",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              margin: 0,
            }}
          >
            Noticias Crypto
          </h1>
          <p style={{ color: "#9CA3AF", fontSize: "14px", margin: "4px 0 0" }}>
            Noticias en tiempo real de CryptoCompare
          </p>
        </div>

        {/* Selector orden + refetch */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <select
            id="news-sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              background: "#1A1A2E",
              color: "#E5E7EB",
              border: "1px solid #2D2D50",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "13px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="latest">Más recientes</option>
            <option value="popular">Más populares</option>
          </select>

          <button
            id="news-refresh-btn"
            onClick={refetch}
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {loading ? "⏳" : "↻ Actualizar"}
          </button>
        </div>
      </div>

      {/* -------- Chips de categorías -------- */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
          overflowX: "auto",
          paddingBottom: "4px",
        }}
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          const color = cat === "ALL" ? "#8B5CF6" : categoryColor(cat);
          return (
            <span
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                ...chipBase,
                background: isActive ? `${color}30` : "#1A1A2E",
                color: isActive ? color : "#6B7280",
                borderColor: isActive ? `${color}60` : "#2D2D50",
              }}
            >
              {cat === "ALL" ? "Todas" : cat}
            </span>
          );
        })}
      </div>

      {/* -------- Estado de carga / error -------- */}
      {loading && (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "3px solid #2D2D50",
              borderTopColor: "#8B5CF6",
              borderRadius: "50%",
              margin: "0 auto 16px",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <p style={{ color: "#9CA3AF", fontSize: "14px" }}>Cargando noticias…</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "32px",
            background: "#1A1A2E",
            borderRadius: "16px",
            border: "1px solid #EF444440",
          }}
        >
          <p style={{ color: "#EF4444", fontWeight: 600, margin: "0 0 8px" }}>Error</p>
          <p style={{ color: "#9CA3AF", fontSize: "14px", margin: "0 0 16px" }}>{error}</p>
          <button
            onClick={refetch}
            style={{
              background: "#EF4444",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              padding: "8px 20px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* -------- Lista de noticias -------- */}
      {!loading && !error && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.length === 0 && (
            <p style={{ color: "#6B7280", textAlign: "center", padding: "32px" }}>
              No se encontraron noticias para esta categoría.
            </p>
          )}

          {filtered.map((article) => {
            const cats = (article.categories || "").split("|").filter(Boolean).slice(0, 3);

            return (
              <a
                key={article.id}
                href={article.guid || article.url}
                target="_blank"
                rel="noopener noreferrer"
                id={`news-article-${article.id}`}
                style={{
                  textDecoration: "none",
                  display: "block",
                  background: "linear-gradient(180deg, #131327 0%, #0C0C17 100%)",
                  borderRadius: "16px",
                  overflow: "hidden",
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
                {/* Imagen (si existe) */}
                {article.imageurl && (
                  <div
                    style={{
                      width: "100%",
                      height: isMobile ? "160px" : "200px",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      src={article.imageurl}
                      alt={article.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    {/* Gradiente sobre imagen */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "60px",
                        background: "linear-gradient(transparent, #131327)",
                      }}
                    />
                  </div>
                )}

                <div style={{ padding: isMobile ? "16px" : "24px" }}>
                  {/* Meta: categorías + fecha */}
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
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {cats.map((c) => (
                        <span
                          key={c}
                          style={{
                            background: `${categoryColor(c)}20`,
                            color: categoryColor(c),
                            padding: "4px 12px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      {article.source_info?.name && (
                        <span style={{ color: "#6B7280", fontSize: "11px" }}>
                          {article.source_info.name}
                        </span>
                      )}
                      <span style={{ color: "#6B7280", fontSize: "11px" }} title={formatDate(article.published_on)}>
                        {timeAgo(article.published_on)}
                      </span>
                    </div>
                  </div>

                  {/* Título */}
                  <h3
                    style={{
                      color: "#FFFFFF",
                      fontSize: isMobile ? "15px" : "18px",
                      fontWeight: 600,
                      margin: "0 0 8px 0",
                      lineHeight: 1.4,
                    }}
                  >
                    {article.title}
                  </h3>

                  {/* Body */}
                  <p
                    style={{
                      color: "#9CA3AF",
                      fontSize: isMobile ? "13px" : "14px",
                      margin: 0,
                      lineHeight: 1.6,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {article.body}
                  </p>

                  {/* Footer: tags + fuente */}
                  {article.tags && (
                    <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {article.tags
                        .split("|")
                        .filter(Boolean)
                        .slice(0, 5)
                        .map((tag) => (
                          <span
                            key={tag}
                            style={{
                              background: "#1A1A2E",
                              color: "#6B7280",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>
                  )}
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
