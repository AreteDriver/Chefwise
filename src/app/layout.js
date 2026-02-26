import '@/styles/globals.css';
import Providers from './providers';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'ChefWise - AI Cooking Assistant',
  description: 'ChefWise - AI-powered cooking assistant for personalized recipes and meal planning',
  manifest: '/manifest.json',
  themeColor: '#10B981',
  applicationName: 'ChefWise',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ChefWise',
  },
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/icons/icon-72.png', sizes: '72x72' },
      { url: '/icons/icon-96.png', sizes: '96x96' },
      { url: '/icons/icon-128.png', sizes: '128x128' },
      { url: '/icons/icon-144.png', sizes: '144x144' },
      { url: '/icons/icon-152.png', sizes: '152x152' },
      { url: '/icons/icon-192.png', sizes: '192x192' },
      { url: '/icons/icon-384.png', sizes: '384x384' },
      { url: '/icons/icon-512.png', sizes: '512x512' },
    ],
  },
  other: {
    'msapplication-TileImage': '/icons/icon-144.png',
    'msapplication-TileColor': '#10B981',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
