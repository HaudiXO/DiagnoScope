import React from 'react';

export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-8 border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            <h2 className="text-xl font-semibold mb-4 text-[var(--color-fg)]">{title}</h2>
            <div>{children}</div>
        </section>
    );
}
