'use client';

import { useState } from 'react';

export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copiado, setCopiado] = useState(false);

  async function partilhar() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, text, url }).catch(() => undefined);
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Sem permissão para a área de transferência: nada a fazer.
    }
  }

  return (
    <button
      type="button"
      onClick={partilhar}
      aria-live="polite"
      className="rounded-full border border-sacred-200 px-4 py-2 text-xs font-semibold text-sacred-700 hover:border-gold-500 hover:text-gold-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 dark:border-sacred-600 dark:text-parchment-100 dark:hover:text-gold-400"
    >
      {copiado ? 'Ligação copiada' : 'Partilhar'}
    </button>
  );
}
