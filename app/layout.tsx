import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Archivo } from 'next/font/google';
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './globals.scss';
import 'flag-icons/css/flag-icons.min.css';
import { Providers } from './providers';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { MobileTabBar } from '@/components/MobileTabBar';
import { theme } from '@/lib/theme';

// Heritage type system: Cormorant Garamond (display/headings) + Archivo (body/UI).
// Armenian glyphs aren't covered, so they fall back per-character via the var() stack.
const displayFont = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});
const bodyFont = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barber-shop.am';
const siteName = 'Barber-Shop';
const siteDescription =
  'Discover barbershops and independent barbers in Yerevan and book appointments online — anytime, in Armenian, English, or Russian.';

const OG_LOCALE: Record<string, string> = { hy: 'hy_AM', en: 'en_US', ru: 'ru_RU' };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${siteName} — Book barbers in Yerevan`,
      template: `%s — ${siteName}`,
    },
    description: siteDescription,
    applicationName: siteName,
    keywords: [
      'barber Yerevan',
      'barbershop Yerevan',
      'book barber online',
      'haircut Yerevan',
      'վարսավիր Երևան',
      'барбер Ереван',
    ],
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName,
      title: `${siteName} — Book barbers in Yerevan`,
      description: siteDescription,
      url: siteUrl,
      locale: OG_LOCALE[locale] ?? 'hy_AM',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} — Book barbers in Yerevan`,
      description: siteDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    appleWebApp: { capable: true, title: siteName, statusBarStyle: 'default' },
  };
}

export const viewport: Viewport = { themeColor: '#352a1f' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${displayFont.variable} ${bodyFont.variable}`} {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body suppressHydrationWarning>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <ModalsProvider>
            <Notifications />
            <NextIntlClientProvider locale={locale} messages={messages}>
              <Providers>
                <SiteHeader />
                <main className="appMain">{children}</main>
                <SiteFooter />
                <MobileTabBar />
              </Providers>
            </NextIntlClientProvider>
          </ModalsProvider>
        </MantineProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
