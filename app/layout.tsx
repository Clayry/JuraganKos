import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JuraganKos — Kelola kos, lebih beres.',
  description: 'Manajemen kamar, penghuni, dan pembayaran sewa dalam satu tempat.',
  icons: { icon: [{ url: '/favicon.svg?v=2', type: 'image/svg+xml' }] },
};

export const viewport: Viewport = {
  themeColor: '#2563EB',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
