import type { Metadata } from 'next';
import './globals.scss';

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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
