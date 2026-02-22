'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, clearToken, saveToken, type TokenData } from '../app/lib/authStorage';

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
    loginWithToken: (doctor: Doctor, tokenData: TokenData) => void;
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
        const storedToken = getToken();
        const storedDoctor = localStorage.getItem('auth_doctor');

        if (storedToken && storedDoctor) {
            try {
                setDoctor(JSON.parse(storedDoctor));
            } catch (e) {
                console.error('Failed to parse doctor from localStorage', e);
                clearToken();
                localStorage.removeItem('auth_doctor');
            }
        } else {
            // Also check legacy token key
            const legacyToken = localStorage.getItem('auth_token');
            if (legacyToken && storedDoctor) {
                try {
                    setDoctor(JSON.parse(storedDoctor));
                    // Migrate to new format
                    saveToken({ accessToken: legacyToken, tokenType: 'bearer' });
                } catch {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('auth_doctor');
                }
            }
        }
        setIsLoading(false);
    }, []);

    const login = (doc: Doctor, token: string) => {
        saveToken({ accessToken: token, tokenType: 'bearer' });
        localStorage.setItem('auth_doctor', JSON.stringify(doc));
        setDoctor(doc);
    };

    const loginWithToken = (doc: Doctor, tokenData: TokenData) => {
        saveToken(tokenData);
        localStorage.setItem('auth_doctor', JSON.stringify(doc));
        setDoctor(doc);
    };

    const logout = () => {
        clearToken();
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
        <AuthContext.Provider value={{ doctor, isAuthed: !!doctor, login, loginWithToken, logout, register, isLoading }}>
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
