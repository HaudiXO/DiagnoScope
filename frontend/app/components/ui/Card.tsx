import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Extra padding preset. Default: 'base' (p-4). */
    padding?: 'none' | 'sm' | 'base';
}

const paddings = {
    none: '',
    sm: 'p-3',
    base: 'p-4',
};

export default function Card({
    padding = 'base',
    className = '',
    children,
    ...rest
}: CardProps) {
    return (
        <div
            {...rest}
            className={[
                'bg-[var(--color-surface)]',
                'border border-[var(--color-border)]',
                'rounded-[var(--radius-md)]',
                'shadow-[var(--shadow-sm)]',
                paddings[padding],
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {children}
        </div>
    );
}
