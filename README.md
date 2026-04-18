# HTML → JS Converter

A small web tool that turns static HTML snippets into **vanilla JavaScript** that builds the same DOM using `document.createElement`, `createElementNS` (for SVG), attributes, and `appendChild`. The UI is a split editor: paste HTML on the left, copy or download the generated script on the right.

## Features

- **Live conversion** — Output updates as you type (parsed in the browser with `DOMParser`).
- **Nested markup** — Walks the tree and wires parent/child relationships.
- **Sensible attribute handling** — `class` → `classList.add`, inline `style` → `style.cssText`, `data-*` → `dataset` camelCase keys, other attributes → `setAttribute`.
- **SVG** — Detects SVG elements and uses `document.createElementNS` with the SVG namespace.
- **Text and comments** — Text nodes and HTML comments become `textContent`, `createTextNode`, or `createComment` as needed.
- **Export options** — Wrap the result in an exported function (with a custom name), or append root nodes to `document.body` when not wrapped.
- **DX** — Syntax-highlighted output, copy to clipboard, download as `dom-elements.js`, optional sample HTML, light/dark theme.

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [shadcn/ui](https://ui.shadcn.com/) (Radix primitives)
- [Vercel Analytics](https://vercel.com/analytics)

Core conversion logic lives in `lib/html-to-js.ts` and is usable outside the UI.

## Getting started

**Prerequisites:** Node.js 18+ and [pnpm](https://pnpm.io/) (lockfile included).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). For a production build:

```bash
pnpm build
pnpm start
```

## Using the converter in code

```ts
import { convertHtmlToJs, type ConversionOptions } from "@/lib/html-to-js";

const js = convertHtmlToJs('<div class="box">Hello</div>', {
  wrapInFunction: true,
  functionName: "mount",
  appendToBody: false,
});
```

### `ConversionOptions`

| Option           | Default           | Description |
|------------------|-------------------|-------------|
| `wrapInFunction` | `false`           | Wrap generated statements in `export function name() { ... }`. Returns a single root element or an array of roots. |
| `functionName`   | `"createElements"`| Name of the exported function when `wrapInFunction` is true. |
| `appendToBody`   | `false`           | When not wrapping in a function, append each top-level root to `document.body`. |
| `useConst`       | —                 | Reserved for future use; declarations use `const`. |

## Project layout

- `app/` — Next.js routes and layout
- `components/html-converter.tsx` — Main editor and options UI
- `lib/html-to-js.ts` — HTML → JS conversion
- `components/ui/` — Shared UI primitives

## License

Private project; see repository owner for terms of use.
