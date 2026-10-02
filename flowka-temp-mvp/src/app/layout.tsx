import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
const manrope = localFont({
  src: '../assets/Manrope.ttf',
  variable: '--font-manrope',
  display: 'swap',
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: { default: 'Flowka — Цветы и игрушки в Астане', template: '%s | Flowka' },
  description: 'Цветы и игрушки с доставкой в Астане. Гүлдер мен ойыншықтар — Астанаға жеткізу.',
  openGraph: {
    title: 'Flowka',
    description: 'Цветы и игрушки · Гүлдер мен ойыншықтар',
    type: 'website',
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${manrope.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
