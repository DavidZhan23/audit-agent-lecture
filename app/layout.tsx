import type { Metadata } from "next";
import "./globals.css";
import "./course-interactives.css";

export const metadata: Metadata = {
  title: "LLM，Agent基础、架构以及其在审计中的应用",
  description: "从审计问题出发：规则 → 特征拟合（ML）→ ANN → LLM → Agent+LLM，讲清每层功用、优劣与落地边界。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "LLM，Agent基础、架构以及其在审计中的应用",
    description: "规则 → ML → ANN → LLM → Agent。以同一笔报销看清每层多做什么。",
    type: "website",
    images: ["/og-v3.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "LLM，Agent基础、架构以及其在审计中的应用",
    description: "规则 → ML → ANN → LLM → Agent。",
    images: ["/og-v3.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
