import React, { useState, useCallback } from "react";

// COMPONENT TO DISPLAY CODE SNIPPETS WITH A COPY BUTTON
export function CodeBlock({ language, content }) {
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
