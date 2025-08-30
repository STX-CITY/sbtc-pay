import type { Metadata } from "next";
import "./globals.css";
import { DocsFAB } from '@/components/docs/docs-fab';
import { TestnetWarning } from '@/components/testnet-warning';
import Script from 'next/script';


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
      <body>
        <Script
          id="error-handler"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Global error handler for early errors
              window.addEventListener('error', function(e) {
                console.error('[Global Error]', {
                  message: e.message,
                  filename: e.filename,
                  lineno: e.lineno,
                  colno: e.colno,
                  error: e.error,
                  stack: e.error?.stack,
                  url: window.location.href,
                  timestamp: new Date().toISOString()
                });
              });
              
              window.addEventListener('unhandledrejection', function(e) {
                console.error('[Unhandled Promise]', {
                  reason: e.reason,
                  url: window.location.href,
                  timestamp: new Date().toISOString()
                });
              });
              
              // Check critical APIs availability
              try {
                if (typeof localStorage === 'undefined') {
                  console.error('[Critical] localStorage is not available');
                }
              } catch (e) {
                console.error('[Critical] Error checking localStorage:', e);
              }
            `
          }}
        />
        <TestnetWarning />
        {children}
        <DocsFAB />
      </body>
    </html>
  );
}
