import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { Disclaimer } from "@/components/disclaimer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "WGU Certs",
  description:
    "See how certifications and prior degrees may apply toward WGU School of Technology programs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${fraunces.variable} h-full`}
    >
      <body
        className="min-h-full flex flex-col"
        style={
          {
            "--font-body": "var(--font-figtree), sans-serif",
            "--font-display": "var(--font-fraunces), Georgia, serif",
          } as CSSProperties
        }
      >
        <SiteHeader />
        <main className="shell">{children}</main>
        <div className="shell" style={{ paddingTop: 0 }}>
          <Disclaimer compact />
        </div>
      </body>
    </html>
  );
}
