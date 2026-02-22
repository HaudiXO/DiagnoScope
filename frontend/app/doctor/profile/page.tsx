'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth';
import { useI18n } from '../../../lib/i18n';
import { useFallback } from '../../lib/FallbackContext';
import { getProfile } from '../../lib/services/profileService';
import ProtectedRoute from '../../components/ProtectedRoute';

export default function DoctorProfilePage() {
    const { doctor, logout, login } = useAuth();
    const { t } = useI18n();
    const { setFallback } = useFallback();

    // For local editing
    const [isEditing, setIsEditing] = useState(false);
    const [fullName, setFullName] = useState(doctor?.fullName || '');
    const [specialty, setSpecialty] = useState(doctor?.specialty || '');
    const [profileLoading, setProfileLoading] = useState(true);

    // Fetch profile from API on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const profile = await getProfile();
                if (cancelled) return;

                // Update local state with fetched profile data
                const fetchedName = `${profile.first_name} ${profile.last_name}`.trim();
                if (fetchedName && fetchedName !== doctor?.fullName) {
                    setFullName(fetchedName);
                }
                if (profile.role && profile.role !== doctor?.specialty) {
                    setSpecialty(profile.role);
                }
            } catch (err) {
                if (!cancelled) {
                    console.warn('[ProfilePage] Failed to fetch profile:', err);
                    setFallback('Profile: API unavailable');
                }
            } finally {
                if (!cancelled) setProfileLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleSave = () => {
        if (doctor) {
            const updatedDoctor = { ...doctor, fullName, specialty };
            // Mock token doesn't change
            const token = localStorage.getItem('auth_token') || 'mock_token';
            login(updatedDoctor, token);
            setIsEditing(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="max-w-2xl mx-auto mt-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">
                        {t.doctorProfile}
                    </h1>
                    <button
                        onClick={logout}
                        className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] border border-transparent hover:border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)] transition-colors focus-ring"
                    >
                        {t.logout}
                    </button>
                </div>

                <div className="p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                    {profileLoading ? (
                        <div className="text-center py-8 text-[var(--color-muted)]">Загрузка профиля...</div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                                    {t.email}
                                </label>
                                <div className="text-[var(--color-fg)] px-3 py-2 bg-[var(--color-bg)] rounded-[var(--radius-md)] border border-transparent opacity-70">
                                    {doctor?.email}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                                    {t.fullName}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-[var(--color-fg)]"
                                    />
                                ) : (
                                    <div className="text-[var(--color-fg)] px-3 py-2">
                                        {fullName || doctor?.fullName}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">
                                    {t.specialty}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={specialty}
                                        onChange={(e) => setSpecialty(e.target.value)}
                                        className="w-full p-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] focus:outline-none focus:border-[var(--color-primary)] transition-colors text-[var(--color-fg)]"
                                    />
                                ) : (
                                    <div className="text-[var(--color-fg)] px-3 py-2">
                                        {specialty || doctor?.specialty}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-[var(--color-border)]">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setFullName(doctor?.fullName || '');
                                                setSpecialty(doctor?.specialty || '');
                                            }}
                                            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-bg)] transition-colors focus-ring"
                                        >
                                            {t.cancel}
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-[var(--color-primary)] text-[#070A06] hover:bg-[var(--color-primary-hover)] transition-colors focus-ring"
                                        >
                                            {t.save}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] hover:border-[var(--color-primary)] transition-colors focus-ring"
                                    >
                                        {t.editProfile}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
