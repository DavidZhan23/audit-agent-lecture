import type { Metadata } from "next";
import "./globals.css";
import "./course-interactives.css";

export const metadata: Metadata = {
  title: "LLM，Agent基础、架构以及其在审计中的应用",
  description: "三部分讲清大模型技术基础、Agent基础与架构，以及Agent在审计中的应用。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "LLM，Agent基础、架构以及其在审计中的应用",
    description: "技术基础 → Agent基础与架构 → Agent在审计中的应用。",
    type: "website",
    images: ["/og-v3.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "LLM，Agent基础、架构以及其在审计中的应用",
    description: "技术基础 → Agent基础与架构 → Agent在审计中的应用。",
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
