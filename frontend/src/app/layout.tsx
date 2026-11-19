import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0b57d0",
};

export const metadata: Metadata = {
  title: "Chronomind - AI Dynamic Project & Deadline Planner",
  description: "Trình quản lý dự án & lập lịch thông minh tích hợp AI thân thiện như Google Workspace",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Chronomind",
  },
  formatDetection: {
    telephone: false,
  },
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
