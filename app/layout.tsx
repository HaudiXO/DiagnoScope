import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hackathon Demo UI',
  description: 'Minimal UI for Hackathon demo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-bold text-lg hover:text-blue-600 transition-colors">
                App Logo
              </Link>
              <nav className="flex gap-4">
                <Link href="/" className="text-sm font-medium hover:text-blue-600 transition-colors">
                  Diagnose
                </Link>
                <Link href="/history" className="text-sm font-medium hover:text-blue-600 transition-colors">
                  History
                </Link>
              </nav>
            </div>
            <div />
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
