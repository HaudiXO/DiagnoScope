'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, Doctor } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';

export default function RegisterPage() {
    const { register } = useAuth();
    const { t } = useI18n();
    const router = useRouter();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
        if (password !== confirmPassword) {
            setError(t.passwordsDoNotMatch);
            return;
        }

        // Mock registration
        const mockDoctor: Doctor = {
            id: 'doc_' + Date.now(),
            fullName: fullName || 'New Doctor',
            email: email,
            specialty: 'General Practice',
        };
        const mockToken = 'mock_jwt_token_' + Date.now();

        register(mockDoctor, mockToken);
        router.push('/doctor/profile');
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
            <h1 className="text-2xl font-bold mb-6 text-center text-[var(--color-fg)]">{t.registerTitle}</h1>

            {error && (
                <div className="mb-4 p-3 rounded-[var(--radius-md)] bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] text-[var(--color-danger)] text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                        {t.fullName}
                    </label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-[var(--color-fg)]"
                        required
                    />
                </div>

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

                <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                        {t.confirmPassword}
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-[var(--color-fg)]"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full mt-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[#070A06] font-medium py-2 px-4 rounded-[var(--radius-md)] transition-colors focus-ring"
                >
                    {t.registerButton}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--color-muted)]">
                {t.hasAccount}{' '}
                <Link href="/auth/login" className="text-[var(--color-primary)] hover:underline focus-ring rounded">
                    {t.loginLink}
                </Link>
            </div>
        </div>
    );
}
