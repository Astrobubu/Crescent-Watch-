import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Crescent Watch | رصد الهلال",
  description: "High-precision Islamic lunar crescent visibility map and simulation. Track when and where the new moon will be visible worldwide.",
  keywords: ["crescent", "hilal", "moon", "islamic calendar", "ramadan", "visibility", "astronomy"],
  authors: [{ name: "Constant Labs" }],
  openGraph: {
    title: "Crescent Watch | رصد الهلال",
    description: "Track Islamic lunar crescent visibility worldwide",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a1628",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cairo.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
