"use client";

import { useRippleTheme } from "@/components/ripple-theme-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  convertHtmlToJsDetailed,
  type ConversionOptions,
  type GeneratedBinding,
} from "@/lib/html-to-js";
import { setupMonacoTailwindcss } from "@/lib/monaco-bootstrap";
import {
  applyVariableRenames,
  isValidRenameIdentifier,
} from "@/lib/variable-rename";
import Editor, { OnMount, type BeforeMount } from "@monaco-editor/react";
import { emmetCSS, emmetHTML } from "emmet-monaco-es";
import {
  ArrowRight,
  Braces,
  Check,
  Code2,
  Copy,
  Download,
  FileCode,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { editor } from "monaco-editor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const EXAMPLE_HTML = `<div class="card" data-id="42">
  <header class="card-header">
    <h2>Hello World</h2>
    <span class="badge">New</span>
  </header>
  <p class="card-body" style="color: #333;">
    This is an example component.
  </p>
  <svg viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" fill="none"/>
  </svg>
  <footer>
    <button class="btn btn-primary" type="button">
      Click here
    </button>
  </footer>
</div>`;

export function HtmlConverter() {
  const [html, setHtml] = useState(EXAMPLE_HTML);
  const [rawOutput, setRawOutput] = useState("");
  const [bindings, setBindings] = useState<GeneratedBinding[]>([]);
  const [renames, setRenames] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameCanonical, setRenameCanonical] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renameError, setRenameError] = useState("");
  const [options, setOptions] = useState<ConversionOptions>({
    wrapInFunction: true,
    functionName: "Component",
    appendToBody: false,
    useConst: true,
  });
  const { theme } = useRippleTheme();

  const htmlEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const outputEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const bindingsRef = useRef(bindings);
  const renamesRef = useRef(renames);
  bindingsRef.current = bindings;
  renamesRef.current = renames;

  const displayedOutput = useMemo(
    () => applyVariableRenames(rawOutput, renames),
    [rawOutput, renames],
  );

  const displayNameFor = useCallback(
    (canonical: string) => renames[canonical] ?? canonical,
    [renames],
  );

  const handleHtmlEditorBeforeMount: BeforeMount = (monaco) => {
    setupMonacoTailwindcss(monaco);
  };

  const handleHtmlEditorDidMount: OnMount = (editor, monaco) => {
    emmetHTML(monaco);
    emmetCSS(monaco);
    htmlEditorRef.current = editor;
  };

  useEffect(() => {
    if (!html.trim()) {
      setRawOutput("");
      setBindings([]);
      return;
    }
    try {
      const { code, bindings: nextBindings } = convertHtmlToJsDetailed(
        html,
        options,
      );
      setRawOutput(code);
      setBindings(nextBindings);
    } catch {
      setRawOutput(
        "// Errore durante la conversione. Verifica il codice HTML.",
      );
      setBindings([]);
    }
  }, [html, options]);

  useEffect(() => {
    const valid = new Set(bindings.map((b) => b.name));
    setRenames((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const k of Object.keys(next)) {
        if (!valid.has(k)) {
          delete next[k];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [bindings]);

  const tryOpenRenameForWord = useCallback(
    (word: string) => {
      const getDisplay = (c: string) => renamesRef.current[c] ?? c;
      const canonical = bindingsRef.current.find(
        (b) => getDisplay(b.name) === word,
      )?.name;
      if (!canonical) return false;
      setRenameCanonical(canonical);
      setRenameDraft(getDisplay(canonical));
      setRenameError("");
      setRenameOpen(true);
      return true;
    },
    [],
  );

  const handleRenameSave = useCallback(() => {
    if (!renameCanonical) return;
    const trimmed = renameDraft.trim();
    if (!isValidRenameIdentifier(trimmed)) {
      setRenameError(
        "Use a valid JavaScript identifier (letters, numbers, _, $). Reserved names are not allowed.",
      );
      return;
    }
    const others = bindings.filter((b) => b.name !== renameCanonical);
    const taken = others.some((b) => displayNameFor(b.name) === trimmed);
    if (taken) {
      setRenameError("That name is already used by another variable.");
      return;
    }
    setRenames((prev) => {
      const next = { ...prev };
      if (trimmed === renameCanonical) {
        delete next[renameCanonical];
      } else {
        next[renameCanonical] = trimmed;
      }
      return next;
    });
    setRenameOpen(false);
    setRenameCanonical(null);
  }, [renameCanonical, renameDraft, bindings, displayNameFor]);

  const handleOutputEditorMount: OnMount = (ed, monaco) => {
    outputEditorRef.current = ed;

    const runRenameAtPosition = () => {
      const model = ed.getModel();
      const pos = ed.getPosition();
      if (!model || !pos) return;
      const w = model.getWordAtPosition(pos);
      if (!w) return;
      tryOpenRenameForWord(w.word);
    };

    ed.onMouseDown((e) => {
      if (e.event.detail === 2 && e.target.position) {
        const model = ed.getModel();
        if (!model) return;
        const w = model.getWordAtPosition(e.target.position);
        if (w && tryOpenRenameForWord(w.word)) {
          e.event.preventDefault();
          e.event.stopPropagation();
        }
      }
    });

    ed.addAction({
      id: "html-to-js-rename-symbol",
      label: "Rename variable",
      keybindings: [monaco.KeyCode.F2],
      run: runRenameAtPosition,
    });
  };

  const handleCopy = useCallback(async () => {
    if (!displayedOutput) return;
    await navigator.clipboard.writeText(displayedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [displayedOutput]);

  const handleDownload = useCallback(() => {
    if (!displayedOutput) return;
    const blob = new Blob([displayedOutput], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dom-elements.js";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [displayedOutput]);

  const handleClear = useCallback(() => {
    setHtml("");
    setRawOutput("");
    setBindings([]);
    setRenames({});
    htmlEditorRef.current?.focus();
  }, []);

  const handleLoadExample = useCallback(() => {
    setHtml(EXAMPLE_HTML);
  }, []);

  return (
    <div className="flex flex-col h-full">
      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (!open) setRenameCanonical(null);
        }}
      >
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename variable</DialogTitle>
            <DialogDescription>
              Updates every occurrence of this binding in the generated code.
              Double-click a name in the output or press F2 with the cursor on
              it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rename-input" className="text-xs text-muted-foreground">
              New name
            </Label>
            <Input
              id="rename-input"
              value={renameDraft}
              onChange={(e) => {
                setRenameDraft(e.target.value);
                setRenameError("");
              }}
              className="font-mono text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRenameSave();
                }
              }}
              autoFocus
            />
            {renameError ? (
              <p className="text-sm text-destructive">{renameError}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRenameOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleRenameSave}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conversion options */}
      <div className="border-b border-border bg-card shrink-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Braces className="size-4 shrink-0" />
            <span>Conversion options</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <Switch
                id="wrap-fn"
                checked={options.wrapInFunction}
                onCheckedChange={(v) =>
                  setOptions((prev) => ({ ...prev, wrapInFunction: v }))
                }
              />
              <Label htmlFor="wrap-fn" className="text-sm text-foreground cursor-pointer whitespace-nowrap">
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
                  className="h-7 w-36 sm:w-40 text-xs font-mono bg-secondary border-border"
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
                <Label htmlFor="append-body" className="text-sm text-foreground cursor-pointer whitespace-nowrap">
                  Add to body
                </Label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 relative">
        {/* HTML Input Panel */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-border min-h-[200px] lg:min-h-0">
          {/* HTML Input Panel Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border h-[60px]">
            <div className="flex items-center gap-2">
              <FileCode className="size-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                HTML Input
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadExample}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="size-3" />
                Example
              </Button>
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
          </div>

          {/* HTML Input Panel Content */}
          <div className="flex-1 relative min-h-0">
            <Editor
              beforeMount={handleHtmlEditorBeforeMount}
              onMount={handleHtmlEditorDidMount}
              className="w-full h-auto flex-auto [&>div]:h-full [&>div]:w-full"
              defaultLanguage="html"
              value={html}
              onChange={(value) => setHtml(value || "")}
              theme={theme === "dark" ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                // Default Monaco: strings: off — Tailwind completions run inside class="..."
                quickSuggestions: {
                  other: true,
                  comments: false,
                  strings: true,
                },
                suggestOnTriggerCharacters: true,
              }}
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

          {/* JavaScript Output Panel Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border gap-2 h-[60px]">
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  JavaScript Output
                </span>
              </div>
              {bindings.length > 0 ? (
                <span className="text-xs text-muted-foreground pl-6 truncate">
                  Double-click a variable or press F2 to rename (all usages
                  update).
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                disabled={!displayedOutput}
              >
                <Download className="size-3" />
                Download
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                disabled={!displayedOutput}
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
          </div>

          {/* JavaScript Output Panel Content */}
          <div className="flex-1 min-h-0 relative">
            {!displayedOutput ? (
              <div className="flex items-center justify-center h-full min-h-[180px] text-muted-foreground text-sm font-mono">
                Your JavaScript code will appear here...
              </div>
            ) : (
              <Editor
                onMount={handleOutputEditorMount}
                className="absolute inset-0 w-full h-full min-h-[180px] [&>div]:h-full [&>div]:w-full"
                defaultLanguage="javascript"
                value={displayedOutput}
                theme={theme === "dark" ? "vs-dark" : "light"}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  selectionHighlight: true,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
