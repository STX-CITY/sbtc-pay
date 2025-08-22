import type { Metadata } from "next";
import "./globals.css";
import { DocsFAB } from '@/components/docs/docs-fab';


export const metadata: Metadata = {
  title: "sBTC Pay - Bitcoin Payment Processor",
  description: "Accept Bitcoin payments with sBTC Pay. Fast, secure, and developer-friendly payment processing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        {children}
        <DocsFAB />
      </body>
    </html>
  );
}
