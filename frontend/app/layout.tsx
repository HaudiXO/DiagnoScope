'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from './components/ui/Icon';
import { USE_MOCK } from './lib/demoMode';
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

function Footer() {
  const [mode, setMode] = useState<string>(USE_MOCK ? 'demo' : 'live');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('dx_history_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.length > 0) {
          const last = parsed[0].mode;
          if (last) setMode(last);
        }
      }
    } catch { }

    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      setMode(custom.detail);
    };
    window.addEventListener('medassist-mode', handler);
    return () => window.removeEventListener('medassist-mode', handler);
  }, []);

  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center text-xs text-[var(--color-muted)] flex flex-col items-center gap-2 w-full">
      <p>
        <strong>Demo Disclaimer:</strong> This application is for demonstration purposes only. Not intended for actual medical use.
      </p>
      <p>
        Current mode: <span className="font-semibold uppercase px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[var(--color-fg)]">{mode}</span>
      </p>
    </footer>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Anti-flash script: runs before React hydrates */}
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
        <header
          style={{
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
          className="sticky top-0 z-10"
        >
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="font-bold text-base tracking-tight hover:text-[var(--color-primary)] transition-colors"
              >
                🩺 MedAssist
              </Link>
              <nav className="flex gap-4">
                <Link
                  href="/"
                  className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
                >
                  Patients
                </Link>
                <Link
                  href="/history"
                  className="text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
                >
                  History
                </Link>
              </nav>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
