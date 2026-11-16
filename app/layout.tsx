import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import FloatingChatButton from "@/components/layout/FloatingChatButton";
import PwaRegister from "@/components/pwa/PwaRegister";
import OfflineStatus from "@/components/pwa/OfflineStatus";
import { DEFAULT_THEME, THEME_IDS, THEME_STORAGE_KEY } from "@/lib/themes";

const themeScript = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var ids=${JSON.stringify(THEME_IDS)};document.documentElement.dataset.theme=ids.indexOf(t)>-1?t:${JSON.stringify(DEFAULT_THEME)}}catch(e){document.documentElement.dataset.theme=${JSON.stringify(DEFAULT_THEME)}}`;

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Daylog",
  description: "Track your habits and workouts every day.",
  applicationName: "Daylog",
  appleWebApp: {
    capable: true,
    title: "Daylog",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0e12",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <FloatingChatButton />
          <PwaRegister />
          <OfflineStatus />
          <Toaster richColors position="top-center" closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
