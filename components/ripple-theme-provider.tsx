"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: (e: React.MouseEvent) => void;
  isAnimating: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useRippleTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useRippleTheme must be used within RippleThemeProvider");
  return ctx;
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "light" || stored === "dark") return stored;
  if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

export function RippleThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Read saved theme on mount
  useEffect(() => {
    const saved = getStoredTheme();
    setTheme(saved);
    document.documentElement.classList.toggle("dark", saved === "dark");
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(
    (e: React.MouseEvent) => {
      if (isAnimating) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      const newTheme: Theme = theme === "dark" ? "light" : "dark";

      // Instant swap for reduced motion
      if (prefersReducedMotion) {
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        localStorage.setItem("theme", newTheme);
        return;
      }

      // Get click coordinates
      const x = e.clientX;
      const y = e.clientY;

      // Calculate the max radius needed to cover the entire viewport
      const maxX = Math.max(x, window.innerWidth - x);
      const maxY = Math.max(y, window.innerHeight - y);
      const maxRadius = Math.sqrt(maxX * maxX + maxY * maxY);

      const overlay = overlayRef.current;
      if (!overlay) return;

      setIsAnimating(true);

      // Determine the background color of the *new* theme
      // We read it from the CSS custom properties for the target theme
      const targetBg =
        newTheme === "dark"
          ? "oklch(0 0 0)"
          : "oklch(0.994 0 0)";

      // Position and style the overlay circle
      overlay.style.left = `${x}px`;
      overlay.style.top = `${y}px`;
      overlay.style.backgroundColor = targetBg;
      overlay.style.display = "block";

      // Animate using Web Animations API for compositor-thread performance
      const animation = overlay.animate(
        [
          {
            width: "0px",
            height: "0px",
            marginLeft: "0px",
            marginTop: "0px",
            opacity: "1",
          },
          {
            width: `${maxRadius * 2}px`,
            height: `${maxRadius * 2}px`,
            marginLeft: `${-maxRadius}px`,
            marginTop: `${-maxRadius}px`,
            opacity: "1",
          },
        ],
        {
          duration: 650,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          fill: "forwards",
        }
      );

      // At ~55% of the expansion, swap the actual theme underneath
      const swapTimer = setTimeout(() => {
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        localStorage.setItem("theme", newTheme);
      }, 360);

      animation.onfinish = () => {
        // Fade out the overlay
        const fadeOut = overlay.animate(
          [{ opacity: "1" }, { opacity: "0" }],
          { duration: 200, easing: "ease-out", fill: "forwards" }
        );
        fadeOut.onfinish = () => {
          overlay.style.display = "none";
          setIsAnimating(false);
        };
      };

      animation.oncancel = () => {
        clearTimeout(swapTimer);
        overlay.style.display = "none";
        setIsAnimating(false);
      };
    },
    [theme, isAnimating]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isAnimating }}>
      {children}
      {/* Ripple overlay - fixed, full screen, pointer-events none */}
      <div
        ref={overlayRef}
        aria-hidden="true"
        style={{
          display: "none",
          position: "fixed",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 9999,
          willChange: "width, height, margin, opacity",
        }}
      />
      {/* Prevent FOUC: hide until mounted */}
      {!mounted && (
        <style>{`body { visibility: hidden; }`}</style>
      )}
    </ThemeContext.Provider>
  );
}
