'use client';

/**
 * VoiceInputButton
 * ----------------
 * Uses browser Web Speech API to append transcript to a textarea.
 * Hidden automatically when the API is not available.
 */

import { useEffect, useRef, useState } from 'react';

interface Props {
    onTranscript: (text: string) => void;
}

// Minimal type shim so TS doesn't complain in strict mode.
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onerror: ((e: Event) => void) | null;
    onend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition?: new () => SpeechRecognitionInstance;
        webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    }
}

export default function VoiceInputButton({ onTranscript }: Props) {
    const [supported, setSupported] = useState(false);
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

    useEffect(() => {
        const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
        if (Ctor) {
            setSupported(true);
            const r = new Ctor();
            r.continuous = false;
            r.interimResults = false;
            r.lang = 'en-US';
            r.onresult = (e: SpeechRecognitionEvent) => {
                const text = Array.from(e.results)
                    .map((res) => res[0].transcript)
                    .join(' ');
                onTranscript(text);
            };
            r.onerror = () => setListening(false);
            r.onend = () => setListening(false);
            recognitionRef.current = r;
        }
        // cleanup: nothing permanent to release
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!supported) return null;

    function toggle() {
        const r = recognitionRef.current;
        if (!r) return;
        if (listening) {
            r.stop();
            setListening(false);
        } else {
            r.start();
            setListening(true);
        }
    }

    return (
        <button
            type="button"
            aria-label={listening ? 'Stop recording' : 'Start voice input'}
            title={listening ? 'Stop recording' : 'Dictate symptoms'}
            onClick={toggle}
            className={`p-2 rounded-full border transition-colors ${listening
                    ? 'border-red-400 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300 animate-pulse'
                    : 'border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
        >
            {/* Simple mic SVG — no external icon deps */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
                aria-hidden
            >
                <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4Zm6.5 9a.5.5 0 0 1 1 0A7.5 7.5 0 0 1 12.5 17.5v2.5h2a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1h2v-2.5A7.5 7.5 0 0 1 4.5 10a.5.5 0 0 1 1 0 6.5 6.5 0 0 0 13 0Z" />
            </svg>
        </button>
    );
}
