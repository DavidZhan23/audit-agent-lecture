import type { Metadata } from "next";
import "./globals.css";
import "./course-interactives.css";
import "./presentation.css";

export const metadata: Metadata = {
  title: "大语言模型与智能体：基础、架构及审计应用",
  description: "三部分讲清大模型技术基础、智能体基础与架构，以及智能体在审计中的应用。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "大语言模型与智能体：基础、架构及审计应用",
    description: "技术基础 → 智能体基础与架构 → 智能体在审计中的应用。",
    type: "website",
    images: ["/og-v3.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "大语言模型与智能体：基础、架构及审计应用",
    description: "技术基础 → 智能体基础与架构 → 智能体在审计中的应用。",
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
