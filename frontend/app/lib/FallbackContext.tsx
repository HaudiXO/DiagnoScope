'use client';

/**
 * FallbackContext.tsx
 * -------------------
 * Tracks whether the app is in mock / fallback / live mode.
 * Provides a badge in the header for visual indicator.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { USE_MOCK } from './config';

export type AppMode = 'live' | 'mock' | 'fallback';

interface FallbackState {
    mode: AppMode;
    reason?: string;
    /** Call this when a real API call fails and data falls back to mock. */
    setFallback: (reason: string) => void;
    /** Reset back to live after a successful call. */
    setLive: () => void;
}

const FallbackContext = createContext<FallbackState>({
    mode: USE_MOCK ? 'mock' : 'live',
    setFallback: () => { },
    setLive: () => { },
});

export function FallbackProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<AppMode>(USE_MOCK ? 'mock' : 'live');
    const [reason, setReason] = useState<string | undefined>();

    const setFallback = useCallback((r: string) => {
        setMode('fallback');
        setReason(r);
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[FallbackContext] Switched to fallback');
        }
    }, []);

    const setLive = useCallback(() => {
        setMode(USE_MOCK ? 'mock' : 'live');
        setReason(undefined);
    }, []);

    return (
        <FallbackContext.Provider value={{ mode, reason, setFallback, setLive }}>
            {children}
        </FallbackContext.Provider>
    );
}

export function useFallback() {
    return useContext(FallbackContext);
}

/**
 * Small floating badge component — import and place in the header.
 */
export function ModeBadge() {
    const { mode, reason } = useFallback();

    if (mode === 'live') return null;

    const label = mode === 'mock' ? 'Mock' : 'Fallback';
    const bg = mode === 'mock'
        ? 'rgba(59,130,246,0.15)'   // blue tint
        : 'rgba(245,158,11,0.15)';  // amber tint
    const color = mode === 'mock'
        ? 'rgb(96,165,250)'
        : 'rgb(251,191,36)';

    return (
        <span
            title={reason ?? `Режим: ${label}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.02em',
                background: bg,
                color: color,
                border: `1px solid ${color}`,
                lineHeight: 1.4,
            }}
        >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
            {label}
        </span>
    );
}
