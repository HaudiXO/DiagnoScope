'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { login as apiLogin, ApiError } from '../../lib/services/authService';
import type { Doctor } from '../../../lib/auth';

export default function LoginPage() {
    const { loginWithToken } = useAuth();
    const { t } = useI18n();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email.includes('@')) {
            setError(t.invalidEmail);
            return;
        }
        if (password.length < 8) {
            setError(t.passwordTooShort);
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await apiLogin(email, password);

            // Map profile to Doctor shape for AuthProvider
            const doc: Doctor = {
                id: result.profile.id || 'doc_1',
                fullName: `${result.profile.first_name} ${result.profile.last_name}`.trim() || email,
                email: result.profile.email || email,
                specialty: result.profile.role || '',
            };

            loginWithToken(doc, result.token);
            router.push('/doctor/profile');
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 401 || err.status === 403) {
                    setError('Неверный логин или пароль');
                } else {
                    setError('Ошибка сервера/сети');
                }
            } else {
                setError('Ошибка сервера/сети');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <h1 className="text-2xl font-bold mb-6 text-center text-[var(--color-fg)]">{t.loginTitle}</h1>

            {error && (
                <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] text-[var(--color-danger)] text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                        {t.email}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-[var(--color-fg)]"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                        {t.password}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-[var(--color-fg)]"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[#070A06] font-medium py-2 px-4 rounded-[var(--radius-md)] transition-colors focus-ring disabled:opacity-50"
                >
                    {isSubmitting ? '...' : t.loginButton}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--color-muted)]">
                {t.noAccount}{' '}
                <Link href="/auth/register" className="text-[var(--color-primary)] hover:underline focus-ring rounded">
                    {t.registerLink}
                </Link>
            </div>
        </div>
    );
}
