import React from 'react';
import { renderMarkdown } from './renderMarkdown';
import { CodeBlock } from './CodeBlock';

// COMPONENT THAT PARSES MESSAGE TEXT AND RENDERS EITHER CODE BLOCKS OR MARKDOWN
export function MessageContent({ text }) {
  const parts = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", language: match[1], content: match[2] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }
  const items = parts.length ? parts : [{ type: "text", content: text }];

  return items.map((part, i) => {
    if (part.type === "code") {
      return <CodeBlock key={i} language={part.language} content={part.content} />;
    }
    return <span key={i}>{renderMarkdown(part.content)}</span>;
  });
}
