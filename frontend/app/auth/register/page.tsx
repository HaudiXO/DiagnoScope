'use client';

import Link from 'next/link';
import { useI18n } from '../../../lib/i18n';

export default function RegisterPage() {
    const { t } = useI18n();

    return (
        <div className="max-w-md mx-auto mt-12 p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <h1 className="text-2xl font-bold mb-3 text-center text-[var(--color-fg)]">{t.registerTitle}</h1>
            <p className="text-sm text-[var(--color-muted)] text-center leading-relaxed">
                Саморегистрация отключена в live-режиме. Аккаунт создается администратором системы.
            </p>
            <div className="mt-6 text-center text-sm text-[var(--color-muted)]">
                {t.hasAccount}{' '}
                <Link href="/auth/login" className="text-[var(--color-primary)] hover:underline focus-ring rounded">
                    {t.loginLink}
                </Link>
            </div>
        </div>
    );
}
