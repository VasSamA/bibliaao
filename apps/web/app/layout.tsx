import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import './globals.css';

const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const sans = Manrope({
  variable: '--font-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Biblia.ao — Leitura, estudo e divulgação da Bíblia',
  description:
    'A plataforma digital para leitura bíblica avançada, estudos, devocionais e recursos para igrejas em Angola e no mundo lusófono.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Biblia.ao' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#113642',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO">
      <body className={`${display.variable} ${sans.variable} flex min-h-screen flex-col font-sans`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
