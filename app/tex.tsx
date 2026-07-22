"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

export function TeX({
  math,
  display = false,
  ariaLabel,
}: {
  math: string;
  display?: boolean;
  ariaLabel?: string;
}) {
  const html = katex.renderToString(math, {
    throwOnError: false,
    displayMode: display,
    strict: "ignore",
  });
  if (display) {
    return (
      <div
        className="math-line katex-block"
        aria-label={ariaLabel}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }
  return (
    <span
      className="katex-inline"
      aria-label={ariaLabel}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
