import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import TranquilloGuideToggle from "../components/TranquilloGuideToggle";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tranquillo Green — Cannabis Financial Operations Platform",
  description: "Multi-entity accounting, automated 280E + 471(c) allocations, Metrc-integrated inventory, and cash reconciliation — built for cannabis operators and their CPAs.",
  keywords: ["cannabis accounting software", "280E tax compliance", "cannabis COGS allocation", "Metrc reconciliation", "cannabis CPA software", "471c election", "cannabis financial software"],
  openGraph: {
    title: "Tranquillo Green — Cannabis Financial Operations Platform",
    description: "Automated 280E + 471(c) allocations, Metrc-integrated inventory, multi-entity accounting — built for cannabis operators and their CPAs.",
    type: "website",
    siteName: "Tranquillo Green",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tranquillo Green — Cannabis Financial Operations Platform",
    description: "Automated 280E + 471(c) allocations, Metrc-integrated inventory, multi-entity accounting.",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Tranquillo Green",
              url: "https://tranquillo.green",
              description: "Cannabis financial operations platform with automated 280E + 471(c) allocations, Metrc-integrated inventory, and multi-entity accounting.",
              sameAs: [
                "https://twitter.com/tranquillogreen",
                "https://linkedin.com/company/tranquillo-green",
              ],
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var t = localStorage.getItem('tranquillo-theme');
    if (t === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
  } catch(e) {}
})();
`,
          }}
        />
      </head>
      <body>
        <ClerkProvider afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
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
