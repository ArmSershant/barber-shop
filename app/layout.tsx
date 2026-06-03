import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.scss';
import { Providers } from './providers';
import { SiteHeader } from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Barber-Shop — Book barbers in Yerevan',
  description:
    'Discover barber shops and independent barbers in Yerevan and book appointments online.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <SiteHeader />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
