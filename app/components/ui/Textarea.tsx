import React from 'react';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export default function Textarea({ className = '', ...props }: TextareaProps) {
    return (
        <textarea
            {...props}
            className={[
                'block w-full px-3 py-2 text-sm resize-none',
                'bg-[var(--color-surface)] text-[var(--color-fg)]',
                'border border-[var(--color-border)] rounded-[var(--radius-md)]',
                'placeholder:text-[var(--color-muted)]',
                'focus-ring',
                'transition-colors',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        />
    );
}
