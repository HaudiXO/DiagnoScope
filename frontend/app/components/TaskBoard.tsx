'use client';

import { useEffect, useId, useState } from 'react';
import {
    readTaskBoard,
    writeTaskBoard,
    resetTaskBoard,
    type PlanItem,
    type TaskBoard,
} from '../lib/taskBoard';

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
    patientId: string;
    /** Current API mode to show in the "How it works" badge (live/mock/fallback/null). */
    currentMode?: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeId(): string {
    return Math.random().toString(36).slice(2, 9);
}

function save(patientId: string, board: TaskBoard): TaskBoard {
    const next = { ...board, updatedAt: new Date().toISOString() };
    writeTaskBoard(patientId, next);
    return next;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function TaskBoard({ patientId, currentMode }: Props) {
    const uid = useId();
    const [board, setBoard] = useState<TaskBoard | null>(null);
    const [newStep, setNewStep] = useState('');
    const [howOpen, setHowOpen] = useState(false);

    // Load from localStorage on mount (client-only).
    useEffect(() => {
        setBoard(readTaskBoard(patientId));
    }, [patientId]);

    if (!board) return null; // hydration guard

    // ── Mutations ────────────────────────────────────────────────────────────

    function update(patch: Partial<TaskBoard>) {
        setBoard((prev) => {
            if (!prev) return prev;
            const next = save(patientId, { ...prev, ...patch });
            return next;
        });
    }

    function addStep() {
        if (!board) return;
        const text = newStep.trim();
        if (!text) return;
        const newItem: PlanItem = { id: makeId(), text, done: false };
        update({ plan: [...board.plan, newItem] });
        setNewStep('');
    }

    function toggleDone(id: string) {
        if (!board) return;
        update({
            plan: board.plan.map((item) =>
                item.id === id ? { ...item, done: !item.done } : item,
            ),
        });
    }

    function deleteStep(id: string) {
        if (!board) return;
        update({ plan: board.plan.filter((item) => item.id !== id) });
    }

    function handleReset() {
        const fresh = resetTaskBoard(patientId);
        setBoard(fresh);
    }

    // ── Render ───────────────────────────────────────────────────────────────

    const doneCount = board.plan.filter((i) => i.done).length;
    const modeBadgeClass =
        currentMode === 'live'
            ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
            : currentMode === 'mock'
                ? 'bg-[var(--color-amber-bg)] text-[var(--color-warning)]'
                : currentMode === 'fallback'
                    ? 'bg-orange-900/40 text-orange-400'
                    : 'bg-[var(--color-elevated)] text-[var(--color-muted)]';

    return (
        <section className="flex flex-col gap-3 border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            {/* Header */}
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                    Задачи&nbsp;&amp;&nbsp;План
                </span>
                <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-[var(--color-danger)] hover:opacity-80 transition-opacity"
                    title="Сбросить план для этого пациента"
                >
                    Сбросить план
                </button>
            </div>

            {/* Task title */}
            <input
                id={`${uid}-title`}
                type="text"
                placeholder="Название задачи…"
                value={board.taskTitle}
                onChange={(e) => update({ taskTitle: e.target.value })}
                className="w-full text-sm font-medium border-b border-[var(--color-border)] bg-transparent pb-1 focus:outline-none focus:border-[var(--color-primary)] text-[var(--color-fg)] placeholder:text-[var(--color-muted)] transition-colors"
            />

            {/* Plan items */}
            {
                board.plan.length > 0 && (
                    <ul className="space-y-1.5">
                        {board.plan.map((item) => (
                            <li key={item.id} className="flex items-start gap-2 group">
                                <input
                                    type="checkbox"
                                    checked={item.done}
                                    onChange={() => toggleDone(item.id)}
                                    className="mt-0.5 flex-shrink-0 accent-[var(--color-primary)] focus-ring rounded-sm"
                                    aria-label={`Mark "${item.text}" done`}
                                />
                                <span
                                    className={`flex-1 text-sm leading-snug ${item.done
                                        ? 'line-through text-[var(--color-muted)] opacity-60'
                                        : 'text-[var(--color-fg)]'
                                        }`}
                                >
                                    {item.text}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => deleteStep(item.id)}
                                    className="opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-opacity text-xs leading-none mt-0.5 flex-shrink-0"
                                    aria-label={`Delete step "${item.text}"`}
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                )
            }

            {/* Progress */}
            {
                board.plan.length > 0 && (
                    <p className="text-xs text-[var(--color-muted)]">
                        {doneCount}/{board.plan.length} выполнено
                    </p>
                )
            }

            {/* Add step */}
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Добавить шаг плана…"
                    value={newStep}
                    onChange={(e) => setNewStep(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') addStep();
                    }}
                    className="flex-1 text-sm border border-[var(--color-border)] rounded-[var(--radius-sm)] px-2 py-1 bg-[var(--color-elevated)] focus-ring placeholder:text-[var(--color-muted)] text-[var(--color-fg)]"
                />
                <button
                    type="button"
                    onClick={addStep}
                    disabled={!newStep.trim()}
                    className="text-sm px-3 py-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-[#070A06] font-medium rounded-[var(--radius-sm)] transition-colors"
                >
                    Добавить
                </button>
            </div>

            {/* ── How it works ─────────────────────────────────────────────── */}
            <div className="border-t border-[var(--color-border)] pt-2 mt-1">
                <button
                    type="button"
                    onClick={() => setHowOpen((o) => !o)}
                    className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors w-full text-left"
                    aria-expanded={howOpen}
                >
                    <span>{howOpen ? '▾' : '▸'}</span>
                    <span>Как это работает</span>
                    {currentMode && (
                        <span
                            className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${modeBadgeClass}`}
                        >
                            {currentMode}
                        </span>
                    )}
                </button>

                {howOpen && (
                    <ul className="mt-2 space-y-1 pl-4 list-disc text-xs text-[var(--color-muted)] leading-relaxed">
                        <li>
                            Симптомы отправляются в ИИ пайплайн, где они сопоставляются с кодами МКБ-10 с помощью языковой модели.
                        </li>
                        <li>
                            Каждый диагноз ранжируется по показателю уверенности; при возможности возвращаются дополнительные объяснения, протоколы лечения и предупреждения.
                        </li>
                        <li>
                            Если сервер недоступен, система использует заранее подготовленные демо-данные, чтобы интерфейс всегда оставался рабочим.
                        </li>
                    </ul>
                )}
            </div>
        </section >
    );
}
