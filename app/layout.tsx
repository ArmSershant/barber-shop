import type { Metadata } from 'next';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './globals.scss';
import 'flag-icons/css/flag-icons.min.css';
import { Providers } from './providers';
import { SiteHeader } from '@/components/SiteHeader';
import { theme } from '@/lib/theme';

export const metadata: Metadata = {
  title: 'Barber-Shop — Book barbers in Yerevan',
  description:
    'Discover barber shops and independent barbers in Yerevan and book appointments online.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider theme={theme} defaultColorScheme="dark">
          <ModalsProvider>
            <Notifications />
            <NextIntlClientProvider locale={locale} messages={messages}>
              <Providers>
                <SiteHeader />
                {children}
              </Providers>
            </NextIntlClientProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
