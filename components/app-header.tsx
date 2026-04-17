import { Braces, Code2 } from "lucide-react";
import { RippleThemeToggle } from "./ripple-theme-toggle";

export function AppHeader() {
  return (
    <header className="border-b border-border bg-card px-4 py-3 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground">
            <Braces className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight text-balance">
              {"HTML \u2192 JS Converter"}
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Transform static HTML into vanilla JavaScript code
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RippleThemeToggle />
        </div>
      </div>
    </header>
  );
}
