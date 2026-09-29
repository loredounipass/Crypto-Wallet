import React from 'react';

// FUNCTION THAT PARSES MARKDOWN TEXT INTO REACT ELEMENTS
export function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let listItems = [];
  let tableRows = [];
  let inTable = false;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ margin: "6px 0", paddingLeft: "20px", listStyleType: "disc", color: "#E2E8F0", fontSize: "13px", lineHeight: 1.6 }}>
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} style={{ margin: "8px 0", overflowX: "auto", border: "1px solid #2D2D44", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <tbody>
              {tableRows.map((row, rIdx) => {
                const isHeader = rIdx === 0;
                const isSeparator = row.every(cell => cell.includes("---"));
                if (isSeparator) return null;
                return (
                  <tr key={rIdx} style={{ borderBottom: rIdx < tableRows.length - 1 ? "1px solid #2D2D44" : "none", background: isHeader ? "#1A1A2E" : "transparent" }}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} style={{ padding: "6px 10px", fontWeight: isHeader ? 600 : 400, color: isHeader ? "#2186EB" : "#E2E8F0" }}>
                        {formatInline(cell.trim(), `${rIdx}-${cIdx}`)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  const formatInline = (line, keyPrefix) => {
    let result = [];
    let keyIdx = 0;
    const partsBold = line.split(/(\*\*.*?\*\*)/);
    partsBold.forEach(part => {
      if (part.startsWith("**") && part.endsWith("**")) {
        result.push(<strong key={`${keyPrefix}-b-${keyIdx++}`} style={{ fontWeight: 600, color: "#8B5CF6" }}>{part.slice(2, -2)}</strong>);
      } else {
        const partsItalic = part.split(/(\*.*?\*)/);
        partsItalic.forEach(subPart => {
          if (subPart.startsWith("*") && subPart.endsWith("*") && subPart.length > 2) {
            result.push(<em key={`${keyPrefix}-i-${keyIdx++}`} style={{ fontStyle: "italic", color: "#94A3B8" }}>{subPart.slice(1, -1)}</em>);
          } else if (subPart) {
            result.push(subPart);
          }
        });
      }
    });
    return result.length > 0 ? result : line;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      flushList();
      inTable = true;
      const cells = trimmed.split("|").slice(1, -1);
      tableRows.push(cells);
      return;
    } else if (inTable) {
      flushTable();
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(<div key={i} style={{ fontWeight: 600, fontSize: "14px", color: "#F1F5F9", marginTop: "10px", marginBottom: "4px" }}>{formatInline(trimmed.slice(4), i)}</div>);
    } else if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(<div key={i} style={{ fontWeight: 700, fontSize: "15px", color: "#FFF", marginTop: "12px", marginBottom: "6px", borderBottom: "1px solid #2D2D44", paddingBottom: "4px" }}>{formatInline(trimmed.slice(3), i)}</div>);
    } else if (trimmed.startsWith("# ")) {
      flushList();
      elements.push(<div key={i} style={{ fontWeight: 700, fontSize: "16px", color: "#FFF", marginTop: "12px", marginBottom: "6px" }}>{formatInline(trimmed.slice(2), i)}</div>);
    } else if (/^[-*•]\s/.test(trimmed)) {
      listItems.push(<li key={i} style={{ color: "#E2E8F0" }}>{formatInline(trimmed.replace(/^[-*•]\s/, ""), i)}</li>);
    } else if (/^\d+\.\s/.test(trimmed)) {
      flushList();
      const num = trimmed.match(/^\d+\./)[0];
      const rest = trimmed.replace(/^\d+\.\s/, "");
      elements.push(
        <div key={i} style={{ display: "flex", gap: "6px", margin: "2px 0" }}>
          <span style={{ color: "#2186EB", fontWeight: 600, flexShrink: 0 }}>{num}</span>
          <span style={{ color: "#E2E8F0" }}>{formatInline(rest, i)}</span>
        </div>
      );
    } else if (trimmed.startsWith("> ")) {
      flushList();
      elements.push(
        <div key={i} style={{ padding: "6px 10px", margin: "6px 0", borderLeft: "3px solid #8B5CF6", background: "rgba(139, 92, 246, 0.06)", borderRadius: "0 6px 6px 0", color: "#94A3B8", fontStyle: "italic", fontSize: "13px" }}>
          {formatInline(trimmed.slice(2), i)}
        </div>
      );
    } else if (trimmed === "") {
      flushList();
      elements.push(<div key={i} style={{ height: "6px" }} />);
    } else {
      flushList();
      elements.push(<p key={i} style={{ color: "#E2E8F0", margin: "3px 0", lineHeight: 1.6, fontSize: "13px" }}>{formatInline(trimmed, i)}</p>);
    }
  });
  flushList();
  flushTable();
  return elements;
}
