import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
}

const base =
    'inline-flex items-center justify-center font-medium transition-all duration-200 focus-ring rounded-[var(--radius-md)] cursor-pointer select-none active:scale-[0.98]';

const variants: Record<ButtonVariant, string> = {
    primary:
        'bg-[var(--color-primary)] text-[#070A06] hover:bg-[var(--color-primary-hover)] hover:shadow-[0_0_12px_rgba(161,248,0,0.25)] active:bg-[var(--color-primary-pressed)]',
    secondary:
        'border border-[var(--color-border)] bg-transparent text-[var(--color-fg)] hover:bg-[var(--color-primary-soft)]',
    danger:
        'border border-[color-mix(in_srgb,var(--color-danger)_40%,transparent)] text-[var(--color-danger)] hover:bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)]',
    ghost:
        'text-[var(--color-muted)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-fg)]',
};

const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    className = '',
    disabled,
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            {...rest}
            disabled={disabled}
            className={[
                base,
                variants[variant],
                sizes[size],
                disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </button>
    );
}
