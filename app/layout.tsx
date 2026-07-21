import type { Metadata } from "next";
import "./globals.css";
import "./course-interactives.css";

export const metadata: Metadata = {
  title: "LLM，Agent基础、架构以及其在审计中的应用",
  description: "从一项审计任务出发，用五个难度递增的案例讲清规则、ML、ANN、LLM与Agent的能力、边界和审计应用。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "LLM，Agent基础、架构以及其在审计中的应用",
    description: "规则 → ML → ANN → LLM → Agent。问题逐级变难，技术逐层增加能力。",
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
