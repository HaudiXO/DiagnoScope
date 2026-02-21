import Section from '../components/Section';

export default function HistoryPage() {
    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">History</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Previous diagnoses.</p>
            </header>

            <Section title="Recent Analyses">
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No history available yet.</p>
                    <p className="text-sm mt-1">Once you run a diagnosis, it will appear here.</p>
                </div>
            </Section>
        </div>
    );
}
