import type { MetadataRoute } from 'next';

// Web App Manifest — makes the site installable (PWA). Next serves this at
// /manifest.webmanifest and links it automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Barber-Shop — book barbers in Yerevan',
    short_name: 'Barber-Shop',
    description: 'Discover barbershops and independent barbers in Yerevan and book online in seconds.',
    start_url: '/',
    display: 'standalone',
    background_color: '#efe6d4',
    theme_color: '#352a1f',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
