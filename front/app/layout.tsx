import type { Metadata } from "next";
import { Doto, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const doto = Doto({
  subsets: ["latin"],
  variable: "--font-doto",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "OMNIX402",
  description: "x402 payment protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${doto.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
