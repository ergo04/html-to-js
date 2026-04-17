// SVG element names that require createElementNS
const SVG_ELEMENTS = new Set([
  "svg",
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "stop",
  "switch",
  "symbol",
  "text",
  "textPath",
  "title",
  "tspan",
  "use",
  "view",
]);

const SVG_NS = "http://www.w3.org/2000/svg";

interface ConversionOptions {
  rootVarName?: string;
  useConst?: boolean;
  wrapInFunction?: boolean;
  functionName?: string;
  appendToBody?: boolean;
}

function sanitizeVarName(tag: string): string {
  return tag.replace(/[^a-zA-Z0-9]/g, "_");
}

function generateVarName(
  tag: string,
  counters: Map<string, number>
): string {
  const base = sanitizeVarName(tag);
  const count = counters.get(base) ?? 0;
  counters.set(base, count + 1);
  return count === 0 ? base : `${base}${count}`;
}

function escapeJSString(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

function processNode(
  node: Node,
  parentVar: string | null,
  lines: string[],
  counters: Map<string, number>,
  indent: string,
  options: ConversionOptions,
  insideSvg: boolean
): void {
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const varName = generateVarName(tag, counters);
    const decl = options.useConst ? "const" : "const";
    const isSvgElement = SVG_ELEMENTS.has(tag) || insideSvg;
    const newInsideSvg = insideSvg || tag === "svg";

    // Create element
    if (isSvgElement) {
      lines.push(
        `${indent}${decl} ${varName} = document.createElementNS('${SVG_NS}', '${tag}');`
      );
    } else {
      lines.push(
        `${indent}${decl} ${varName} = document.createElement('${tag}');`
      );
    }

    // Set attributes
    const attrs = el.attributes;
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      const name = attr.name;
      const value = escapeJSString(attr.value);

      if (isSvgElement) {
        lines.push(
          `${indent}${varName}.setAttribute('${name}', '${value}');`
        );
      } else if (name === "class") {
        if (value.includes(" ")) {
          const classes = value.split(/\s+/).filter(Boolean);
          lines.push(
            `${indent}${varName}.classList.add(${classes.map((c) => `'${c}'`).join(", ")});`
          );
        } else {
          lines.push(
            `${indent}${varName}.classList.add('${value}');`
          );
        }
      } else if (name === "style") {
        lines.push(
          `${indent}${varName}.style.cssText = '${value}';`
        );
      } else if (name.startsWith("data-")) {
        const camelKey = name
          .slice(5)
          .replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
        lines.push(
          `${indent}${varName}.dataset.${camelKey} = '${value}';`
        );
      } else {
        lines.push(
          `${indent}${varName}.setAttribute('${name}', '${value}');`
        );
      }
    }

    // Process children
    const childNodes = el.childNodes;
    for (let i = 0; i < childNodes.length; i++) {
      const child = childNodes[i];

      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim() ?? "";
        if (text) {
          if (
            childNodes.length === 1 ||
            (el.childNodes.length === 1 && child.nodeType === Node.TEXT_NODE)
          ) {
            lines.push(
              `${indent}${varName}.textContent = '${escapeJSString(text)}';`
            );
          } else {
            const textVar = generateVarName("text", counters);
            lines.push(
              `${indent}${decl} ${textVar} = document.createTextNode('${escapeJSString(text)}');`
            );
            lines.push(`${indent}${varName}.appendChild(${textVar});`);
          }
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        const commentText = child.textContent ?? "";
        const commentVar = generateVarName("comment", counters);
        lines.push(
          `${indent}${decl} ${commentVar} = document.createComment('${escapeJSString(commentText)}');`
        );
        lines.push(`${indent}${varName}.appendChild(${commentVar});`);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        lines.push("");
        processNode(
          child,
          varName,
          lines,
          counters,
          indent,
          options,
          newInsideSvg
        );
      }
    }

    // Append to parent
    if (parentVar) {
      lines.push(`${indent}${parentVar}.appendChild(${varName});`);
    }
  }
}

export function convertHtmlToJs(
  htmlString: string,
  options: ConversionOptions = {}
): string {
  const {
    wrapInFunction = false,
    functionName = "createElements",
    appendToBody = false,
  } = options;

  // Parse the HTML string
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<template>${htmlString}</template>`,
    "text/html"
  );
  const template = doc.querySelector("template");
  if (!template || !template.content) {
    return "// Error: Could not parse the HTML input";
  }

  const fragment = template.content;
  const topLevelNodes = Array.from(fragment.childNodes).filter(
    (n) =>
      n.nodeType === Node.ELEMENT_NODE ||
      (n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
  );

  if (topLevelNodes.length === 0) {
    return "// No elements found in the HTML input";
  }

  const lines: string[] = [];
  const counters = new Map<string, number>();
  const baseIndent = wrapInFunction ? "  " : "";
  const rootVarNames: string[] = [];

  // Track root var names for later use
  for (const node of topLevelNodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const base = sanitizeVarName(tag);
      const count = counters.get(base) ?? 0;
      rootVarNames.push(count === 0 ? base : `${base}${count}`);
    }
  }

  // Reset counters for actual generation
  counters.clear();

  if (wrapInFunction) {
    lines.push(`export function ${functionName}() {`);
  }

  for (let i = 0; i < topLevelNodes.length; i++) {
    const node = topLevelNodes[i];
    if (i > 0) lines.push("");
    processNode(node, null, lines, counters, baseIndent, options, false);
  }

  // Append to body or return
  if (wrapInFunction) {
    if (rootVarNames.length === 1) {
      lines.push("");
      lines.push(`${baseIndent}return ${rootVarNames[0]};`);
    } else if (rootVarNames.length > 1) {
      lines.push("");
      lines.push(
        `${baseIndent}return [${rootVarNames.join(", ")}];`
      );
    }
    lines.push("}");
  } else if (appendToBody) {
    lines.push("");
    for (const varName of rootVarNames) {
      lines.push(`document.body.appendChild(${varName});`);
    }
  }

  return lines.join("\n");
}

export type { ConversionOptions };
