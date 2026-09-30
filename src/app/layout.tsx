import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: { default: 'EmCartaz — filmes em streaming no Brasil', template: '%s · EmCartaz' },
  description:
    'Descubra os filmes disponíveis agora nos serviços de streaming por assinatura no Brasil.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
