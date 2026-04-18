"use client";

import { Moon, Sun } from "lucide-react";
import { useRippleTheme } from "./ripple-theme-provider";
import { Button } from "./ui/button";

export function RippleThemeToggle() {
  const { theme, toggleTheme, isAnimating } = useRippleTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      disabled={isAnimating}
      aria-label={
        theme === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro"
      }
      className="relative size-9 rounded-lg overflow-hidden cursor-pointer"
    >
      <Sun
        className={`size-4.5 absolute transition-all duration-300 ${theme === "dark"
            ? "rotate-90 scale-0 opacity-0"
            : "rotate-0 scale-100 opacity-100"
          }`}
      />
      <Moon
        className={`size-4.5 absolute transition-all duration-300 ${theme === "dark"
            ? "rotate-0 scale-100 opacity-100"
            : "-rotate-90 scale-0 opacity-0"
          }`}
      />
      <span className="sr-only">
        {theme === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro"}
      </span>
    </Button>
  );
}
