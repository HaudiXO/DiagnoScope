'use client';

import { useState, useEffect, createContext, useContext, ReactNode, createElement } from 'react';
import { ru } from './strings.ru';
import { en } from './strings.en';

export type Language = 'ru' | 'en';
export type Dictionary = typeof ru;

interface I18nContextType {
    lang: Language;
    t: Dictionary;
    setLang: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType>({
    lang: 'ru',
    t: ru,
    setLang: () => { },
});

export function I18nProvider({ children }: { children: ReactNode }) {
    const [lang, setLangState] = useState<Language>('ru');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('ui_lang') as Language;
        if (saved === 'en' || saved === 'ru') {
            setLangState(saved);
        }
        setMounted(true);
    }, []);

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('ui_lang', newLang);
    };

    const currentLang = mounted ? lang : 'ru';
    const currentDict = currentLang === 'ru' ? ru : en;

    return createElement(
        I18nContext.Provider,
        { value: { lang: currentLang, t: currentDict, setLang } },
        children
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
