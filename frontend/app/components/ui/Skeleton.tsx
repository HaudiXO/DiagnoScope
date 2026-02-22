export default function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-[var(--color-border)] rounded-[var(--radius-sm)] ${className}`} />
    );
}
