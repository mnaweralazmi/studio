import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

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
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
