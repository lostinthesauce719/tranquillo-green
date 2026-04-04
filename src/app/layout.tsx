import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tranquillo Green",
  description: "Cannabis accounting, compliance, and operations platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
