import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "从普通代码到审计智能体｜审计人员AI基础课",
  description: "面向审计人员的2小时基础课程：从普通代码和规则开始，逐步理解机器学习、神经网络、大模型与智能体。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "从普通代码到审计智能体",
    description: "审计人员的机器学习、神经网络、大模型与智能体基础课",
    type: "website",
    images: ["/og-v2.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "从普通代码到审计智能体",
    description: "审计人员的机器学习、神经网络、大模型与智能体基础课",
    images: ["/og-v2.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
