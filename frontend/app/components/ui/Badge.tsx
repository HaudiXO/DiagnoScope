import React from 'react';

export type BadgeVariant = 'default' | 'blue' | 'amber' | 'red';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
    default:
        'bg-[color-mix(in_srgb,var(--color-muted)_15%,transparent)] text-[var(--color-muted)]',
    blue:
        'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]',
    amber:
        'bg-[var(--color-amber-bg)] text-[var(--color-warning)] border border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]',
    red:
        'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-[var(--color-danger)] border border-[color-mix(in_srgb,var(--color-danger)_25%,transparent)]',
};

export default function Badge({
    variant = 'default',
    className = '',
    children,
    ...rest
}: BadgeProps) {
    return (
        <span
            {...rest}
            className={[
                'inline-flex items-center px-2 py-0.5',
                'text-xs font-medium font-mono',
                'rounded-[var(--radius-sm)]',
                variants[variant],
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </span>
    );
}
