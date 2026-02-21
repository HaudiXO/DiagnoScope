import Section from './components/Section';

export default function DiagnosePage() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Diagnose</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Enter data to diagnose.</p>
      </header>

      <Section title="Input Data">
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="diagnose-input" className="text-sm font-medium">Data entry</label>
            <textarea
              id="diagnose-input"
              className="w-full min-h-[150px] p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Paste your logs or payload here..."
            />
          </div>
          <button
            type="button"
            aria-label="Start diagnosis"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors w-max"
          >
            Diagnose
          </button>
        </div>
      </Section>

      <Section title="Results Placeholder">
        <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">No results to display.</p>
          <p className="text-sm mt-1">Submit data above to view results here.</p>
        </div>
      </Section>
    </div>
  );
}
