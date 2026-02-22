'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthed, isLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isLoading && !isAuthed && mounted) {
            router.push('/auth/login');
        }
    }, [isAuthed, isLoading, router, mounted]);

    // Show nothing while checking auth or before hydration
    if (!mounted || isLoading || !isAuthed) {
        return null;
    }

    return <>{children}</>;
}
