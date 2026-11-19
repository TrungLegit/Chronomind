import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chronomind - AI Dynamic Project & Deadline Planner",
  description: "Trình quản lý dự án & lập lịch thông minh tích hợp AI thân thiện như Google Workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${inter.className} min-h-screen bg-[#f8fafd] text-[#1f1f1f] antialiased`}>
        {children}
      </body>
    </html>
  );
}
