import Section from '../../components/Section';

export default async function ResultDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Diagnosis Result</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Viewing details for ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{id}</code></p>
            </header>

            <Section title="Result Details Placeholder">
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 bg-gray-50 dark:bg-gray-900/50">
                    <p className="text-lg font-medium text-gray-600 dark:text-gray-400">Result data is empty.</p>
                    <p className="text-sm mt-1">This is a placeholder empty state. Actual API data will be displayed here later.</p>
                </div>
            </Section>
        </div>
    );
}
