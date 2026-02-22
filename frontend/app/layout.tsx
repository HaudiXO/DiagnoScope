'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { USE_MOCK } from './lib/demoMode';
import { I18nProvider, useI18n } from '../lib/i18n';
import { AuthProvider, useAuth } from '../lib/auth';
import './globals.css';

// Can't export metadata from a client component — keep it here as a comment for reference.
// title: 'MedAssist Demo', description: 'Hackathon Demo UI'

function Header() {
  const { t } = useI18n();
  const { isAuthed } = useAuth();

  return (
    <header
      style={{
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
      className="sticky top-0 z-10 shadow-sm"
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-4 font-normal text-xl tracking-tight text-[var(--color-primary)] hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="PAXMET Logo" width="48" height="48" className="select-none" />
            MedAssist
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/"
              className="text-sm font-medium px-2 py-1 rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
            >
              {t.navPatients}
            </Link>
            <Link
              href="/history"
              className="text-sm font-medium px-2 py-1 rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
            >
              {t.navHistory}
            </Link>
            {isAuthed ? (
              <Link
                href="/doctor/profile"
                className="text-sm font-medium px-2 py-1 rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
              >
                {t.navProfile}
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="text-sm font-medium px-2 py-1 rounded-[var(--radius-sm)] text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition-colors"
              >
                {t.navLogin}
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <title>MedAssist Demo</title>
        <meta name="description" content="Hackathon Demo UI" />
      </head>
      <body className="min-h-screen antialiased flex flex-col w-full overflow-x-hidden" style={{ background: 'var(--color-bg)', color: 'var(--color-fg)' }}>
        <AuthProvider>
          <I18nProvider>
            <Header />
            <main className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full">{children}</main>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
