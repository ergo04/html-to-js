import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import {
  configureMonacoTailwindcss,
  tailwindcssData,
} from "monaco-tailwindcss";

/**
 * Use the bundled monaco-editor (ESM workers) instead of the loader CDN so we can
 * register the monaco-tailwindcss worker. Must run before any Editor mounts.
 *
 * Workers are created as classic workers — webpack bundles each entry into a
 * single self-contained script. `{ type: "module" }` causes Monaco to fall back
 * to main-thread code loading in Next.js (both turbopack and webpack have
 * issues emitting real ESM workers for bare package specifiers).
 */
if (typeof window !== "undefined") {
  self.MonacoEnvironment = {
    getWorker(_moduleId, label) {
      switch (label) {
        case "editorWorkerService":
          return new Worker(
            new URL(
              "monaco-editor/esm/vs/editor/editor.worker.js",
              import.meta.url,
            ),
          );
        case "css":
        case "less":
        case "scss":
          return new Worker(
            new URL(
              "monaco-editor/esm/vs/language/css/css.worker.js",
              import.meta.url,
            ),
          );
        case "html":
        case "handlebars":
        case "razor":
          return new Worker(
            new URL(
              "monaco-editor/esm/vs/language/html/html.worker.js",
              import.meta.url,
            ),
          );
        case "json":
          return new Worker(
            new URL(
              "monaco-editor/esm/vs/language/json/json.worker.js",
              import.meta.url,
            ),
          );
        case "typescript":
        case "javascript":
          return new Worker(
            new URL(
              "monaco-editor/esm/vs/language/typescript/ts.worker.js",
              import.meta.url,
            ),
          );
        case "tailwindcss":
          return new Worker(
            new URL(
              "monaco-tailwindcss/tailwindcss.worker.js",
              import.meta.url,
            ),
          );
        default:
          throw new Error(`Unknown Monaco worker label: ${label}`);
      }
    },
  };
}

loader.config({ monaco });

let tailwindConfigured = false;

/**
 * Tailwind IntelliSense in HTML/CSS/TS (see monaco-tailwindcss). Call from Editor beforeMount once per app.
 */
export function setupMonacoTailwindcss(monacoApi: typeof monaco) {
  if (tailwindConfigured) return;
  tailwindConfigured = true;

  monacoApi.languages.css.cssDefaults.setOptions({
    data: {
      dataProviders: {
        tailwindcssData,
      },
    },
  });

  configureMonacoTailwindcss(monacoApi);
}
