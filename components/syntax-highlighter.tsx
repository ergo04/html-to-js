"use client";

import { useMemo } from "react";

interface SyntaxHighlighterProps {
  code: string;
  language: "javascript" | "html";
  showLineNumbers?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightJS(code: string): string {
  const lines = code.split("\n");
  return lines
    .map((line) => {
      let result = escapeHtml(line);

      // Comments
      result = result.replace(
        /(\/\/.*$)/gm,
        '<span class="token-comment">$1</span>'
      );

      // Keywords
      result = result.replace(
        /\b(const|let|var|function|return|if|else|for|while|new|import|export|from|class|extends|this|typeof|instanceof)\b/g,
        '<span class="token-keyword">$1</span>'
      );

      // Strings (single/double quotes)
      result = result.replace(
        /('(?:[^'\\]|\\.)*')/g,
        '<span class="token-string">$1</span>'
      );

      // Method calls on objects
      result = result.replace(
        /\.(createElement|createElementNS|createTextNode|createComment|appendChild|setAttribute|classList|add|style|dataset|textContent|cssText)\b/g,
        '.<span class="token-method">$1</span>'
      );

      // document object
      result = result.replace(
        /\b(document)\b/g,
        '<span class="token-variable">$1</span>'
      );

      return result;
    })
    .join("\n");
}

function highlightHTML(code: string): string {
  const escaped = escapeHtml(code);

  let result = escaped;

  // HTML comments
  result = result.replace(
    /(&lt;!--[\s\S]*?--&gt;)/g,
    '<span class="token-comment">$1</span>'
  );

  // Opening tags with attributes
  result = result.replace(
    /(&lt;\/?)([\w-]+)/g,
    '$1<span class="token-tag">$2</span>'
  );

  // Attribute names
  result = result.replace(
    /\s([\w-]+)(=)/g,
    ' <span class="token-attr-name">$1</span>$2'
  );

  // Attribute values in quotes
  result = result.replace(
    /(&quot;[^&]*&quot;)/g,
    '<span class="token-attr-value">$1</span>'
  );

  // Closing brackets
  result = result.replace(
    /(\/?&gt;)/g,
    '<span class="token-punctuation">$1</span>'
  );

  return result;
}

export function SyntaxHighlighter({
  code,
  language,
  showLineNumbers = true,
}: SyntaxHighlighterProps) {
  const highlighted = useMemo(() => {
    if (!code) return "";
    return language === "javascript" ? highlightJS(code) : highlightHTML(code);
  }, [code, language]);

  const lineCount = code.split("\n").length;
  const gutterWidth = Math.max(String(lineCount).length * 0.6 + 1, 2.5);

  if (!code) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm font-mono">
        {language === "html"
          ? "Paste your HTML code here..."
          : "Your JavaScript code will appear here..."}
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-auto font-mono text-sm leading-relaxed">
      <pre className="p-4 m-0">
        <code>
          {showLineNumbers && (
            <span className="inline-block select-none text-muted-foreground/40 text-right mr-4 align-top">
              {Array.from({ length: lineCount }, (_, i) => (
                <span key={i} className="block" style={{ width: `${gutterWidth}ch` }}>
                  {i + 1}
                </span>
              ))}
            </span>
          )}
          <span
            className="inline-block align-top"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </code>
      </pre>
    </div>
  );
}
