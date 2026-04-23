import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import TranquilloGuideToggle from "../components/TranquilloGuideToggle";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Tranquillo Green",
  description: "Cannabis accounting, compliance, and 280E defensibility OS.",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ClerkProvider>
          {/* Skip to main content link for keyboard navigation */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-brand/50"
          >
            Skip to main content
          </a>
          <div id="main-content">{children}</div>
          <TranquilloGuideToggle />
        </ClerkProvider>
      </body>
    </html>
  );
}
