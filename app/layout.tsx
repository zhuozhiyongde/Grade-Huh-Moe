import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/context/AppProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PKU Helper 成绩查询",
  description: "使用 Next.js 重构的 PKUHelper 成绩查询页面",
  icons: {
    icon: [
      { url: "/pku_16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/pku_32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/pku_180x180.png", sizes: "180x180", type: "image/png" },
    ],
    apple: [{ url: "/pku_180x180.png", sizes: "180x180", type: "image/png" }],
    shortcut: [
      { url: "/pku_32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
