import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Owned Social Agent",
  description: "AI social content agent for brands, approvals, scheduling, and publishing."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
