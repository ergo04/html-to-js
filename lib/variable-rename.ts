function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace whole identifiers only (word boundaries). `renames` maps original name → new name.
 */
export function applyVariableRenames(
  code: string,
  renames: Record<string, string>,
): string {
  let result = code;
  for (const [from, to] of Object.entries(renames)) {
    if (!from || !to || from === to) continue;
    const re = new RegExp(`\\b${escapeRegex(from)}\\b`, "g");
    result = result.replace(re, to);
  }
  return result;
}

const IDENTIFIER_RE = /^[a-zA-Z_$][\w$]*$/;

/** Reserved / unsafe names in generated DOM code context */
const DISALLOWED = new Set([
  "document",
  "window",
  "undefined",
  "null",
  "true",
  "false",
  "const",
  "let",
  "var",
  "function",
  "return",
  "export",
  "import",
  "default",
  "new",
  "this",
]);

export function isValidRenameIdentifier(name: string): boolean {
  if (!name || !IDENTIFIER_RE.test(name)) return false;
  if (DISALLOWED.has(name)) return false;
  return true;
}
