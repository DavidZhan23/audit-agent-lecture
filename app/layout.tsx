import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "从“会预测”到“会办事”｜审计智能体互动课",
  description: "面向审计人员的2小时互动课程：零基础看懂机器学习、深度学习、大模型与智能体，并设计第一个审计智能体。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "从“会预测”到“会办事”",
    description: "审计人员的机器学习、大模型与智能体互动课",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "从“会预测”到“会办事”",
    description: "审计人员的机器学习、大模型与智能体互动课",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
