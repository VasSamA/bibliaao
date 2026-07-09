import type { Metadata } from 'next';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import './globals.css';

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
  themeColor: '#243a70',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO">
      <body className="flex min-h-screen flex-col font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
