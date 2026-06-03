import type { Metadata } from 'next';
import './globals.scss';
import { Providers } from './providers';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Barber-Shop — Book barbers in Yerevan',
  description:
    'Discover barber shops and independent barbers in Yerevan and book appointments online.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla) inject
          attributes onto <body> before React hydrates; this ignores that noise. */}
      <body suppressHydrationWarning>
        <Providers>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
