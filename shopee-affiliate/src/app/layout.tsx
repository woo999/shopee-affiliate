import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Shopee TH Affiliate',
  description: 'Threads → Shopee Affiliate Automation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700&family=Noto+Sans+Thai:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <Toaster position="top-right" toastOptions={{
          style: { background:'#1f2937', color:'#f9fafb', borderRadius:'12px', fontSize:'14px' },
          success: { iconTheme: { primary:'#ee2a09', secondary:'#fff' } }
        }} />
      </body>
    </html>
  );
}
