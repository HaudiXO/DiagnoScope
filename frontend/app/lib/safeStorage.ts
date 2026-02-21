export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
    if (!raw) return fallback;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export function safeStorageGet<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return safeJsonParse(raw, fallback);
    } catch {
        return fallback;
    }
}

export function safeStorageSet<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, serialized);
    } catch {
        // Ignore quota exceeded errors
    }
}
