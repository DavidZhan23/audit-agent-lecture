import type { Metadata } from "next";
import "./globals.css";
import "./course-interactives.css";

export const metadata: Metadata = {
  title: "从一笔286元报销，讲清人工智能｜审计智能体基础课",
  description: "用同一笔出租车费，一步步讲清规则、机器学习、神经网络、大模型和智能体各自能做什么、不能做什么。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "从一笔286元报销，讲清人工智能",
    description: "规则 → 机器学习 → 神经网络 → 大模型 → 智能体。",
    type: "website",
    images: ["/og-v3.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "从一笔286元报销，讲清人工智能",
    description: "规则 → 机器学习 → 神经网络 → 大模型 → 智能体。",
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
