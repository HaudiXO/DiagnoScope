'use client';

import { useEffect, useState } from 'react';
import PatientCard from './components/PatientCard';
import {
  readPatients,
  addPatient,
  resetDemoData,
  getLastPatientRun,
  type Patient,
} from './lib/patients';
import type { HistoryEntry } from './lib/history';

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [lastRuns, setLastRuns] = useState<Record<string, HistoryEntry | undefined>>({});
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  function load() {
    const pts = readPatients();
    setPatients(pts);
    const runs: Record<string, HistoryEntry | undefined> = {};
    for (const p of pts) runs[p.id] = getLastPatientRun(p.id);
    setLastRuns(runs);
  }

  useEffect(() => { load(); }, []);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const parsedAge = age ? parseInt(age, 10) : undefined;
    addPatient({ name, age: Number.isFinite(parsedAge) ? parsedAge : undefined });
    setName('');
    setAge('');
    setShowForm(false);
    load();
  }

  function handleReset() {
    resetDemoData();
    load();
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {patients.length} patient{patients.length !== 1 ? 's' : ''} on file
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            {showForm ? 'Cancel' : '+ Add patient'}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 text-sm rounded-md border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
          >
            Reset demo data
          </button>
        </div>
      </header>

      {/* Inline add-patient form */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg space-y-3 bg-white dark:bg-gray-900"
        >
          <div className="flex gap-3 flex-wrap">
            <input
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-[160px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="number"
              placeholder="Age (optional)"
              min={0}
              max={130}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-32 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {/* Patient grid */}
      {patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-gray-500">
          <p className="text-lg font-medium">No patients yet.</p>
          <p className="text-sm mt-1">Add a patient or click &ldquo;Reset demo data&rdquo; to seed examples.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p) => (
            <PatientCard key={p.id} patient={p} lastRun={lastRuns[p.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
