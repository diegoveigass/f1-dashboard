import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import "./globals.css";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-titillium",
});

export const metadata: Metadata = {
  title: "F1 Dashboard",
  description: "Classificação, calendário e resultados de Fórmula 1",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={titillium.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground">
        <Navigation />
        <main className="mx-auto max-w-5xl px-4 pb-20 pt-6 md:pb-6">{children}</main>
      </body>
    </html>
  );
}
