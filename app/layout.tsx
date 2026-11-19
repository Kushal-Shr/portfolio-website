import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'portfolio-sh',
  description: 'Terminal-themed portfolio of Kushal Shrestha.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
