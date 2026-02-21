'use client';

import React, { useEffect, useState } from 'react';
import PatientCard from './components/PatientCard';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import { PlusIcon } from './components/ui/Icon';
import Skeleton from './components/ui/Skeleton';
import {
  readPatients,
  addPatient,
  resetDemoData,
  getLastPatientRun,
  type Patient,
} from './lib/patients';
import { safeStorageGet, safeStorageSet } from './lib/safeStorage';
import type { HistoryEntry } from './lib/history';
import { useI18n } from '../lib/i18n';

type SortKey = 'updated' | 'name' | 'warnings';

const BANNER_KEY = 'dx_banner_dismissed_v1';

function getBannerWarnings(run: HistoryEntry | undefined): number {
  try {
    const w = (run?.rawResponse as Record<string, unknown> | null)?.warnings;
    return Array.isArray(w) ? w.length : 0;
  } catch {
    return 0;
  }
}

export default function PatientsPage() {
  const { t } = useI18n();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [lastRuns, setLastRuns] = useState<Record<string, HistoryEntry | undefined>>({});
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');

  // Search + sort
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');

  const [mounted, setMounted] = useState(false);

  // Getting-started banner
  const [bannerDismissed, setBannerDismissed] = useState(true); // start hidden; read from LS on mount

  function load() {
    const pts = readPatients();
    setPatients(pts);
    const runs: Record<string, HistoryEntry | undefined> = {};
    for (const p of pts) runs[p.id] = getLastPatientRun(p.id);
    setLastRuns(runs);
  }

  useEffect(() => {
    load();
    // Read banner dismiss state from localStorage
    const dismissed = safeStorageGet<string>(BANNER_KEY, '0') === '1';
    setBannerDismissed(dismissed);
    setMounted(true);
  }, []);

  function dismissBanner() {
    setBannerDismissed(true);
    safeStorageSet(BANNER_KEY, '1');
  }

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

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return patients.filter((p) => {
      if (!q) return true;
      const inName = p.name.toLowerCase().includes(q);
      const inSymptoms = (lastRuns[p.id]?.symptoms ?? '').toLowerCase().includes(q);
      return inName || inSymptoms;
    });
  }, [patients, search, lastRuns]);

  // ── Sort ──────────────────────────────────────────────────────────────────
  const sorted = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sort === 'warnings') {
        return getBannerWarnings(lastRuns[b.id]) - getBannerWarnings(lastRuns[a.id]);
      }
      // default: last updated (most recent run first; fall back to createdAt)
      const aTime = lastRuns[a.id]?.createdAt ?? a.createdAt;
      const bTime = lastRuns[b.id]?.createdAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [filtered, sort, lastRuns]);

  // ── Getting-started banner logic ──────────────────────────────────────────
  const hasAnyRun = Object.values(lastRuns).some(Boolean);
  const showBanner = !bannerDismissed && !hasAnyRun && patients.length > 0;

  return (
    <div className="space-y-6">
      {/* Getting-started banner */}
      {showBanner && (
        <div
          className="relative rounded-[var(--radius-lg)] border p-5"
          style={{
            borderColor: 'var(--color-border)',
            background: 'color-mix(in srgb, var(--color-primary) 5%, var(--color-surface))',
          }}
        >
          <button
            onClick={dismissBanner}
            aria-label={t.dismiss}
            className="absolute top-3 right-3 text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors text-lg leading-none"
          >
            ×
          </button>
          <p className="font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>
            {t.gettingStartedTitle}
          </p>
          <ol className="space-y-1.5 text-sm" style={{ color: 'var(--color-muted)' }}>
            <li>
              <span className="font-medium" style={{ color: 'var(--color-fg)' }}>{t.gsStep1Title}</span>
              {t.gsStep1Desc}
            </li>
            <li>
              <span className="font-medium" style={{ color: 'var(--color-fg)' }}>{t.gsStep2Title}</span>
              {t.gsStep2Desc}
            </li>
            <li>
              <span className="font-medium" style={{ color: 'var(--color-fg)' }}>{t.gsStep3Title}</span>
              {t.gsStep3Desc}
            </li>
          </ol>
        </div>
      )}

      {/* Page header */}
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.patientsTitle}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
            {t.patientsOnFile(patients.length)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? (
              t.cancel
            ) : (
              <>
                <PlusIcon size={15} className="mr-1.5" />
                {t.addPatient}
              </>
            )}
          </Button>
          <Button variant="danger" onClick={handleReset}>
            {t.resetDemoData}
          </Button>
        </div>
      </header>

      {/* Inline add-patient form */}
      {showForm && (
        <Card>
          <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
            <Input
              required
              aria-label={t.fullName}
              placeholder={t.fullName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 min-w-[160px]"
            />
            <Input
              type="number"
              aria-label={t.ageOptional}
              placeholder={t.ageOptional}
              min={0}
              max={130}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-32"
            />
            <Button type="submit" variant="primary">
              {t.add}
            </Button>
          </form>
        </Card>
      )}

      {/* Search + sort toolbar — only when there are patients */}
      {patients.length > 0 && (
        <div className="flex gap-3 flex-wrap items-center">
          <Input
            type="search"
            aria-label={t.searchPlaceholder}
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <select
            aria-label={t.patientsTitle}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={[
              'text-sm px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border)]',
              'bg-[var(--color-surface)] text-[var(--color-fg)] focus-ring transition-colors',
            ].join(' ')}
          >
            <option value="updated">{t.sortLastUpdated}</option>
            <option value="name">{t.sortNameAZ}</option>
            <option value="warnings">{t.sortMostWarnings}</option>
          </select>
        </div>
      )}

      {/* Patient grid */}
      {!mounted ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : patients.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-12 rounded-[var(--radius-lg)] border-2 border-dashed"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
          <p className="text-lg font-medium">{t.noPatientsTitle}</p>
          <p className="text-sm mt-1">{t.noPatientsDesc}</p>
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-10 rounded-[var(--radius-lg)] border-2 border-dashed"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
          <p className="text-base font-medium">{t.noResultsTitle(search)}</p>
          <p className="text-sm mt-1">{t.noResultsDesc}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p) => (
            <PatientCard key={p.id} patient={p} lastRun={lastRuns[p.id]} />
          ))}
        </div>
      )}
    </div>
  );
}
