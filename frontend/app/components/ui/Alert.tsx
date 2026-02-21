import { ReactNode } from 'react';

interface AlertProps {
    title?: string;
    children: ReactNode;
    variant?: 'error' | 'warning' | 'info';
    action?: ReactNode;
    className?: string;
}

export default function Alert({ title, children, variant = 'error', action, className = '' }: AlertProps) {
    const colors = {
        error: 'border-red-300 bg-red-50 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300',
        warning: 'border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300',
        info: 'border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-300',
    };

    return (
        <div className={`rounded-lg border px-4 py-3 flex justify-between items-start gap-3 ${colors[variant]} ${className}`}>
            <div className="w-full">
                {title && <h4 className="font-semibold mb-1 text-sm">{title}</h4>}
                <div className="text-sm">{children}</div>
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
        </div>
    );
}
