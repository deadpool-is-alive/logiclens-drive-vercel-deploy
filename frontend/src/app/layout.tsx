import type { Metadata } from "next";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['500', '600', '700'] });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-body', weight: ['400', '500', '600', '700'] });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] });

export const metadata: Metadata = {
  title: "DAM System",
  description: "Search, preview, and manage company assets stored in Google Drive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable} font-body antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)]">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}