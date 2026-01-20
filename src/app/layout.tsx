import type { Metadata, Viewport } from "next";
import { Outfit, Tajawal } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crescent Watch | رصد الاهلة",
  description: "High-precision Islamic lunar crescent visibility map and simulation. Track when and where the new moon will be visible worldwide.",
  keywords: ["crescent", "hilal", "moon", "islamic calendar", "ramadan", "visibility", "astronomy"],
  authors: [{ name: "Constant Labs" }],
  openGraph: {
    title: "Crescent Watch | رصد الاهلة",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${outfit.variable} ${tajawal.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
