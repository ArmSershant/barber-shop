import { ImageResponse } from 'next/og';

export const alt = 'Barber-Shop — Book barbers in Yerevan';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #044a37 0%, #0c8f6b 55%, #12b386 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 52,
            }}
          >
            ✂
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, opacity: 0.9 }}>Barber-Shop</div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
          Find your barber, book in seconds
        </div>
        <div style={{ fontSize: 34, marginTop: 28, opacity: 0.85 }}>
          Barbershops & independent barbers in Yerevan
        </div>
      </div>
    ),
    size,
  );
}
