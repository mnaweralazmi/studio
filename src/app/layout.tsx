import './globals.css';
import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { Providers } from '@/components/providers';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kuwaiti Farmer',
  description: 'Your gateway to the world of farming.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}