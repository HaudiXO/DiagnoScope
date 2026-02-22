'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';

export default function LoginPage() {
    const { login } = useAuth();
    const { t } = useI18n();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
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

        // Mock login
        const mockDoctor = {
            id: 'doc_1',
            fullName: 'Dr. John Doe',
            email: email,
            specialty: 'Therapist',
        };
        const mockToken = 'mock_jwt_token_' + Date.now();

        login(mockDoctor, mockToken);
        router.push('/doctor/profile');
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
                    />
                </div>

                <button
                    type="submit"
                    className="w-full mt-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[#070A06] font-medium py-2 px-4 rounded-[var(--radius-md)] transition-colors focus-ring"
                >
                    {t.loginButton}
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
