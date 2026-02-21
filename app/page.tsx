'use client';

import { useEffect, useState } from 'react';
import PatientCard from './components/PatientCard';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import { PlusIcon } from './components/ui/Icon';
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
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {patients.length} patient{patients.length !== 1 ? 's' : ''} on file
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? (
              'Cancel'
            ) : (
              <>
                <PlusIcon size={15} className="mr-1.5" />
                Add patient
              </>
            )}
          </Button>
          <Button variant="danger" onClick={handleReset}>
            Reset demo data
          </Button>
        </div>
      </header>

      {/* Inline add-patient form */}
      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
            <Input
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-[160px]"
            />
            <Input
              type="number"
              placeholder="Age (optional)"
              min={0}
              max={130}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-32"
            />
            <Button type="submit" variant="primary">
              Add
            </Button>
          </form>
        </Card>
      )}

      {/* Patient grid */}
      {patients.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-12 rounded-[var(--radius-lg)] border-2 border-dashed"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
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
