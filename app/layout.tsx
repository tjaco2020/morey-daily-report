import "./globals.css";
import type { Metadata } from "next";
import { Inter, Yesteryear } from "next/font/google";
import { AppShell } from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const yesteryear = Yesteryear({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yesteryear",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Morey's Daily Report",
  description: "Internal operational reporting for Morey's Piers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${yesteryear.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
