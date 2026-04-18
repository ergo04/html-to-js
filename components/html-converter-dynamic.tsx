"use client";

import dynamic from "next/dynamic";

export const HtmlConverter = dynamic(
  () =>
    import("@/components/html-converter").then((m) => ({
      default: m.HtmlConverter,
    })),
  { ssr: false },
);
