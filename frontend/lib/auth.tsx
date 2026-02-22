'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface Doctor {
    id: string;
    fullName: string;
    email: string;
    specialty: string;
}

interface AuthContextType {
    doctor: Doctor | null;
    isAuthed: boolean;
    login: (doctor: Doctor, token: string) => void;
    logout: () => void;
    register: (doctor: Doctor, token: string) => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Hydrate auth state from localStorage on mount
        const storedToken = localStorage.getItem('auth_token');
        const storedDoctor = localStorage.getItem('auth_doctor');

        if (storedToken && storedDoctor) {
            try {
                setDoctor(JSON.parse(storedDoctor));
            } catch (e) {
                console.error('Failed to parse doctor from localStorage', e);
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_doctor');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (doc: Doctor, token: string) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_doctor', JSON.stringify(doc));
        setDoctor(doc);
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_doctor');
        setDoctor(null);
        router.push('/auth/login');
    };

    const register = (doc: Doctor, token: string) => {
        // For MVP, register just logs them in
        login(doc, token);
    };

    return (
        <AuthContext.Provider value={{ doctor, isAuthed: !!doctor, login, logout, register, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
