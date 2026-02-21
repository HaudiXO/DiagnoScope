import React from 'react';

export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="mb-8 border border-gray-200 dark:border-gray-800 rounded-lg p-6 bg-white dark:bg-gray-900 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">{title}</h2>
            <div>{children}</div>
        </section>
    );
}
