'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from './components/ui/Icon';
import { USE_MOCK } from './lib/demoMode';
import { I18nProvider, useI18n } from '../lib/i18n';
import './globals.css';

// Can't export metadata from a client component — keep it here as a comment for reference.
// title: 'MedAssist Demo', description: 'Hackathon Demo UI'

type Theme = 'light' | 'dark';

function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const preferred: Theme =
      saved ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={[
        'p-2 rounded-[var(--radius-md)]',
        'text-[var(--color-muted)] hover:text-[var(--color-fg)]',
        'hover:bg-[var(--color-border)]',
        'transition-colors focus-ring',
      ].join(' ')}
    >
      {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
    </button>
  );
}

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')}
      aria-label="Toggle language"
      className="p-2 text-xs font-bold rounded-[var(--radius-md)] text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-border)] transition-colors focus-ring uppercase"
    >
      {lang}
    </button>
  );
}



function Header() {
  const { t } = useI18n();

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
            className="flex items-center gap-2 font-bold text-xl tracking-tight text-[var(--color-primary)] hover:opacity-80 transition-opacity"
          >
            🩺 MedAssist
          </Link>
          <nav className="flex gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
            >
              {t.navPatients}
            </Link>
            <Link
              href="/history"
              className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
            >
              {t.navHistory}
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>MedAssist Demo</title>
        <meta name="description" content="Hackathon Demo UI" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('theme')||( window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased flex flex-col w-full overflow-x-hidden" style={{ background: 'var(--color-bg)', color: 'var(--color-fg)' }}>
        <I18nProvider>
          <Header />
          <main className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
