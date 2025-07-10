import './globals.css';
import type { Metadata } from 'next';
import { Inter, Urbanist } from 'next/font/google';
import { ToastContainer } from 'react-toastify';

import Provider from '@/provider/provider';
import ClientLayout from './components/user.layout';

const inter = Inter({ subsets: ['latin'] });

const urbanist = Urbanist({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-urbanist',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_BASEURL ?? 'http://localhost:3000'),
  title: 'Albummai | Create Albums with A.I',
  description: 'Create your own album with AlbumCraft',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    images: [
      {
        url: '/images/image-album.jpg',
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${urbanist.className}`}>
        <Provider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Provider>
      </body>
      <ToastContainer position="bottom-right" />
    </html>
  );
}
