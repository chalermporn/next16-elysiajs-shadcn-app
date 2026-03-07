import type { Metadata } from "next";
import { Kanit, Sarabun, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const fontHeading = Kanit({
  variable: "--font-heading",
  subsets: ["latin", "latin-ext", "thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fontSans = Sarabun({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext", "thai"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TodoFlow",
  description: "Todo List App with RBAC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body
        className={`${fontHeading.variable} ${fontSans.variable} ${fontMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
