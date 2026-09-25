import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MedFinder Addis | Real-time Medicine & Pharmacy Search',
  description:
    'Find scarce medicines and verified pharmacies across Addis Ababa in real time. Order by proximity, unlock contacts, and reserve stock.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MedFinder Addis',
  },
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col text-slate-900 bg-slate-50">
        {children}
      </body>
    </html>
  );
}
