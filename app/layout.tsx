import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const outfit  = Outfit({ subsets: ['latin'], variable: '--font-outfit',  weight: ['400','600','700','800','900'] });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', weight: ['400','500','600','700'] });

export const metadata: Metadata = {
  title: 'MathQuest — 6-Sinf Matematika',
  description: '6-sinf matematikasi uchun interaktiv o\'quv platformasi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body className={`${outfit.variable} ${jakarta.variable}`}>
        {children}
      </body>
    </html>
  );
}
