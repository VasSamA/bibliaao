'use client';

import { useState } from 'react';
import { Bookmark, Copy, Share2, StickyNote } from 'lucide-react';
import clsx from 'clsx';

export type Verse = { id: string; number: number; text: string; reference: string };

const COLOR_TAGS = [
  { key: 'amarelo', className: 'bg-yellow-200/70 dark:bg-yellow-500/30' },
  { key: 'azul', className: 'bg-sacred-100 dark:bg-sacred-600/40' },
  { key: 'verde', className: 'bg-green-200/70 dark:bg-green-600/30' },
  { key: 'rosa', className: 'bg-pink-200/70 dark:bg-pink-600/30' },
];

export function VerseReader({ verses, bookName, chapterNumber }: { verses: Verse[]; bookName: string; chapterNumber: number }) {
  const [fontSize, setFontSize] = useState(18);
  const [focusMode, setFocusMode] = useState(false);
  const [highlighted, setHighlighted] = useState<Record<string, string>>({});
  const [activeVerse, setActiveVerse] = useState<string | null>(null);

  function toggleHighlight(verseId: string, colorKey: string) {
    setHighlighted((prev) => {
      const next = { ...prev };
      if (next[verseId] === colorKey) delete next[verseId];
      else next[verseId] = colorKey;
      return next;
    });
  }

  async function copyVerse(v: Verse) {
    await navigator.clipboard.writeText(`"${v.text}" — ${v.reference} (Biblia.ao)`);
  }

  async function shareVerse(v: Verse) {
    const text = `"${v.text}" — ${v.reference}`;
    if (navigator.share) {
      await navigator.share({ title: v.reference, text }).catch(() => undefined);
    } else {
      await copyVerse(v);
    }
  }

  return (
    <div className={clsx('mx-auto max-w-3xl px-4 py-10', focusMode && 'max-w-2xl')}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <h1 className="font-serif text-2xl font-semibold">
          {bookName} {chapterNumber}
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setFontSize((s) => Math.max(14, s - 2))} className="rounded border px-2 py-1">A-</button>
          <button onClick={() => setFontSize((s) => Math.min(28, s + 2))} className="rounded border px-2 py-1">A+</button>
          <button
            onClick={() => setFocusMode((f) => !f)}
            className={clsx('rounded-full border px-3 py-1', focusMode && 'bg-sacred-600 text-white border-sacred-600')}
          >
            Modo foco
          </button>
        </div>
      </div>

      <div className="space-y-1 verse-text" style={{ fontSize }}>
        {verses.map((v) => (
          <div
            key={v.id}
            className={clsx(
              'group relative rounded px-2 py-1 -mx-2 cursor-pointer transition-colors',
              highlighted[v.id] && COLOR_TAGS.find((c) => c.key === highlighted[v.id])?.className,
            )}
            onClick={() => setActiveVerse((cur) => (cur === v.id ? null : v.id))}
          >
            <sup className="mr-1 text-xs text-gold-600 dark:text-gold-400">{v.number}</sup>
            {v.text}

            {activeVerse === v.id && (
              <div
                className="not-verse-text mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-sacred-100 dark:border-sacred-700 bg-parchment-50 dark:bg-sacred-900 p-2 text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => copyVerse(v)} className="flex items-center gap-1 hover:text-gold-600"><Copy size={14} /> Copiar</button>
                <button onClick={() => shareVerse(v)} className="flex items-center gap-1 hover:text-gold-600"><Share2 size={14} /> Partilhar</button>
                <button className="flex items-center gap-1 hover:text-gold-600"><Bookmark size={14} /> Favorito</button>
                <button className="flex items-center gap-1 hover:text-gold-600"><StickyNote size={14} /> Nota</button>
                <span className="mx-1 text-sacred-300">|</span>
                {COLOR_TAGS.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => toggleHighlight(v.id, c.key)}
                    className={clsx('h-5 w-5 rounded-full border', c.className)}
                    aria-label={`Marcar com cor ${c.key}`}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
