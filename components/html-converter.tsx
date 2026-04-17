"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { convertHtmlToJs, type ConversionOptions } from "@/lib/html-to-js";
import { SyntaxHighlighter } from "@/components/syntax-highlighter";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  Copy,
  Check,
  Code2,
  FileCode,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  Braces,
  RotateCcw,
} from "lucide-react";

const EXAMPLE_HTML = `<div class="card" data-id="42">
  <header class="card-header">
    <h2>Hello World</h2>
    <span class="badge">New</span>
  </header>
  <p class="card-body" style="color: #333;">
    Questo e un componente di esempio.
  </p>
  <svg viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>
  <footer>
    <button class="btn btn-primary" type="button">
      Clicca qui
    </button>
  </footer>
</div>`;

export function HtmlConverter() {
  const [html, setHtml] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ConversionOptions>({
    wrapInFunction: false,
    functionName: "createElements",
    appendToBody: false,
    useConst: true,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Run conversion whenever html or options change
  useEffect(() => {
    if (!html.trim()) {
      setOutput("");
      return;
    }
    try {
      const result = convertHtmlToJs(html, options);
      setOutput(result);
    } catch {
      setOutput("// Errore durante la conversione. Verifica il codice HTML.");
    }
  }, [html, options]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dom-elements.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output]);

  const handleClear = useCallback(() => {
    setHtml("");
    setOutput("");
    textareaRef.current?.focus();
  }, []);

  const handleLoadExample = useCallback(() => {
    setHtml(EXAMPLE_HTML);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Options Bar */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2">
          <button
            onClick={() => setShowOptions((v) => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Braces className="size-4" />
            <span>Conversion options</span>
            {showOptions ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLoadExample}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="size-3.5" />
              Example
            </Button>
          </div>
        </div>

        {showOptions && (
          <div className="px-4 pb-3 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-3">
            <div className="flex items-center gap-2">
              <Switch
                id="wrap-fn"
                checked={options.wrapInFunction}
                onCheckedChange={(v) =>
                  setOptions((prev) => ({ ...prev, wrapInFunction: v }))
                }
              />
              <Label htmlFor="wrap-fn" className="text-sm text-foreground cursor-pointer">
                Wrap in function
              </Label>
            </div>

            {options.wrapInFunction && (
              <div className="flex items-center gap-2">
                <Label htmlFor="fn-name" className="text-sm text-muted-foreground whitespace-nowrap">
                  Name:
                </Label>
                <Input
                  id="fn-name"
                  value={options.functionName}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      functionName: e.target.value,
                    }))
                  }
                  className="h-7 w-40 text-xs font-mono bg-secondary border-border"
                />
              </div>
            )}

            {!options.wrapInFunction && (
              <div className="flex items-center gap-2">
                <Switch
                  id="append-body"
                  checked={options.appendToBody}
                  onCheckedChange={(v) =>
                    setOptions((prev) => ({ ...prev, appendToBody: v }))
                  }
                />
                <Label htmlFor="append-body" className="text-sm text-foreground cursor-pointer">
                  Add to body
                </Label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editor Panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 relative">
        {/* HTML Input Panel */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-border min-h-[200px] lg:min-h-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <FileCode className="size-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                HTML Input
              </span>
            </div>
            {html && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10! gap-1"
              >
                <Trash2 className="size-3" />
                Reset
              </Button>
            )}
          </div>
          <div className="flex-1 relative min-h-0">
            <textarea
              ref={textareaRef}
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder={`Paste your HTML code here...\n\nEs:\n<div class="container">\n  <h1>Title</h1>\n  <p>Content</p>\n</div>`}
              className="w-full h-full min-h-[180px] lg:min-h-0 resize-none bg-transparent font-mono text-sm leading-relaxed p-4 outline-none text-foreground placeholder:text-muted-foreground/50"
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
          </div>
        </div>

        {/* Arrow divider (desktop only) */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 cursor-pointer hover:scale-110 transition-all">
          <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg shadow-primary/20">
            <ArrowRight className="size-4" />
          </div>
        </div>

        {/* JS Output Panel */}
        <div className="flex flex-col min-h-[200px] lg:min-h-0">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <div className="flex items-center gap-2">
              <Code2 className="size-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                JavaScript Output
              </span>
            </div>
            {output && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <Download className="size-3" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="size-3 text-primary" />
                      <span className="text-primary">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <SyntaxHighlighter code={output} language="javascript" />
          </div>
        </div>
      </div>
    </div>
  );
}
