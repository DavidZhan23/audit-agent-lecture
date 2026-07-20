import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "42,000笔报销，怎样找到真正值得核查的问题？｜审计智能体基础课",
  description: "先完整面对一个审计任务，再逐步用普通代码、机器学习、神经网络、大模型和智能体增加解决问题的能力。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "从审计问题出发，一步步理解智能体",
    description: "42,000笔报销、4名审计人员、10个工作日：技术究竟能帮我们解决什么？",
    type: "website",
    images: ["/og-v2.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "从审计问题出发，一步步理解智能体",
    description: "42,000笔报销、4名审计人员、10个工作日：技术究竟能帮我们解决什么？",
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
