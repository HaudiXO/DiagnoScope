'use client';

import React, { useCallback, useEffect, useState } from 'react';
import PatientCard from './components/PatientCard';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import Card from './components/ui/Card';
import { PlusIcon } from './components/ui/Icon';
import Skeleton from './components/ui/Skeleton';
import { safeStorageGet, safeStorageSet } from './lib/safeStorage';
import type { HistoryEntry } from './lib/history';
import { useI18n } from '../lib/i18n';
import { chatRepository, patientRepository } from './lib/repositories';
import type { Patient } from './lib/models/schemas';

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
  const [isLoading, setIsLoading] = useState(true);

  // Search + sort
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');

  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Getting-started banner
  const [bannerDismissed, setBannerDismissed] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await patientRepository.listPatients();
      const pts = result.data.items;
      setPatients(pts);

      const runs: Record<string, HistoryEntry | undefined> = {};
      await Promise.all(pts.map(async (p) => {
        const history = await chatRepository.listPatientHistory(p.id);
        runs[p.id] = history.data[0];
      }));
      setLastRuns(runs);
    } catch {
      setLoadError(t.loading + ' ' + t.errorWord);
    } finally {
      setIsLoading(false);
    }
  }, [t.errorWord, t.loading]);

  useEffect(() => {
    load();
    const dismissed = safeStorageGet<string>(BANNER_KEY, '0') === '1';
    setBannerDismissed(dismissed);
    setMounted(true);
  }, [load]);

  function dismissBanner() {
    setBannerDismissed(true);
    safeStorageSet(BANNER_KEY, '1');
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const parsedAge = age ? parseInt(age, 10) : undefined;
      await patientRepository.createPatient({
        name,
        age: Number.isFinite(parsedAge) ? parsedAge : undefined,
      });
      setName('');
      setAge('');
      setShowForm(false);
      await load();
    } catch {
      setLoadError(t.errorWord);
    } finally {
      setIsLoading(false);
    }
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
      const aTime = lastRuns[a.id]?.createdAt ?? a.createdAt;
      const bTime = lastRuns[b.id]?.createdAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [filtered, sort, lastRuns]);

  const hasAnyRun = Object.values(lastRuns).some(Boolean);
  const showBanner = !bannerDismissed && !hasAnyRun && patients.length > 0;

  return (
    <div className="space-y-6">
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
          <p className="font-semibold mb-3 text-[var(--color-primary)]">
            {t.gettingStartedTitle}
          </p>
          <ol className="space-y-1.5 text-sm text-[var(--color-muted)]">
            <li>
              <span className="font-medium text-[var(--color-fg)] mr-2">{t.gsStep1Title}</span>
              {t.gsStep1Desc}
            </li>
            <li>
              <span className="font-medium text-[var(--color-fg)] mr-2">{t.gsStep2Title}</span>
              {t.gsStep2Desc}
            </li>
            <li>
              <span className="font-medium text-[var(--color-fg)] mr-2">{t.gsStep3Title}</span>
              {t.gsStep3Desc}
            </li>
          </ol>
        </div>
      )}

      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-fg)]">{t.patientsTitle}</h1>
          <p className="text-sm mt-1 text-[var(--color-muted)]">
            {t.patientsOnFile(patients.length)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            onClick={() => setShowForm((v) => !v)}
            disabled={isLoading}
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
        </div>
      </header>

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
              disabled={isLoading}
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
              disabled={isLoading}
            />
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? '...' : t.add}
            </Button>
          </form>
        </Card>
      )}

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

      {!mounted || isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : loadError ? (
        <Card>
          <p className="text-sm text-[var(--color-danger)]">{t.errorWord}</p>
          <Button className="mt-3" variant="secondary" onClick={load}>
            {t.rerun}
          </Button>
        </Card>
      ) : patients.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-12 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] text-[var(--color-muted)]"
        >
          <p className="text-lg font-medium text-[var(--color-fg)]">Нет пациентов</p>
          <p className="text-sm mt-1">{t.noPatientsDesc}</p>
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-10 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border)] text-[var(--color-muted)]"
        >
          <p className="text-base font-medium text-[var(--color-fg)]">{t.noResultsTitle(search)}</p>
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
