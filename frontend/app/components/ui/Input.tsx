import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input({ className = '', ...props }: InputProps) {
    return (
        <input
            {...props}
            className={[
                'block w-full px-3 py-2 text-sm',
                'bg-[var(--color-elevated)] text-[var(--color-fg)]',
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
