import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Afacad } from 'next/font/google'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const afacad = Afacad({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-afacad',
})

export const metadata: Metadata = {
  title: "Weight Tracker",
  description: "Track your weight loss journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${afacad.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
