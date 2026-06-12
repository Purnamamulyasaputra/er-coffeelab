import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sourceSansPro = localFont({
  src: [
    { path: '../public/fonts/SourceSansPro-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/SourceSansPro-SemiBold.woff2', weight: '600', style: 'normal' },
    { path: '../public/fonts/SourceSansPro-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-source-sans-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ER Coffeelab",
  description: "Admin Panel & POS System for ER Coffeelab",
};

import { ToastProvider } from "@/components/ui/use-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sourceSansPro.variable}>
      <body className="font-sans antialiased">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
