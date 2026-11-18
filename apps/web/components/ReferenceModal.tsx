'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { api } from '../lib/api';

export type CrossRef = { referencia: string; livro: string; capitulo: number; versiculo: number; votos: number };

type VersoCapitulo = { number: number; text: string };
type Bloco = { capitulo: number; versos: VersoCapitulo[] };

/** Máximo de capítulos carregados para um intervalo longo (o resto fica no link). */
const MAX_CAPITULOS = 4;

/**
 * Lê o intervalo a partir do texto da referência devolvido pela API:
 *   "Livro 3:16"  |  "Livro 3:16-18"  |  "Livro 3:16-4:2"  |  "Livro 3:16 - Outro 1:2"
 */
function lerIntervalo(ref: CrossRef) {
  const base = { capIni: ref.capitulo, versIni: ref.versiculo, capFim: ref.capitulo, versFim: ref.versiculo, outroLivro: false };
  if (ref.referencia.includes(' - ')) return { ...base, outroLivro: true };
  const m = ref.referencia.match(/(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
  if (!m || !m[4]) return base;
  return { ...base, capFim: m[3] ? Number(m[3]) : ref.capitulo, versFim: Number(m[4]) };
}

export function ReferenceModal({
  referencia,
  versao,
  fontSize,
  onClose,
}: {
  referencia: CrossRef;
  versao: string;
  fontSize: number;
  onClose: () => void;
}) {
  const [blocos, setBlocos] = useState<Bloco[] | null>(null);
  const [erro, setErro] = useState(false);
  const [cortado, setCortado] = useState(false);
  const painelRef = useRef<HTMLDivElement>(null);
  const intervalo = lerIntervalo(referencia);

  // Carregar o texto do intervalo.
  useEffect(() => {
    let cancelado = false;
    setBlocos(null);
    setErro(false);
    (async () => {
      try {
        const ultimo = Math.min(intervalo.capFim, intervalo.capIni + MAX_CAPITULOS - 1);
        const resultado: Bloco[] = [];
        for (let c = intervalo.capIni; c <= ultimo; c++) {
          const data = await api.get<{ chapter: { verses: VersoCapitulo[] } }>(`/biblia/${versao}/${referencia.livro}/${c}`);
          const versos = data.chapter.verses.filter(
            (v) =>
              (c !== intervalo.capIni || v.number >= intervalo.versIni) &&
              (c !== intervalo.capFim || v.number <= intervalo.versFim),
          );
          resultado.push({ capitulo: c, versos });
        }
        if (!cancelado) {
          setBlocos(resultado);
          setCortado(ultimo < intervalo.capFim);
        }
      } catch {
        if (!cancelado) setErro(true);
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencia.referencia, versao]);

  // Fechar com Esc, bloquear o scroll da página por trás e pôr o foco na janela.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    painelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onClose]);

  const variosCapitulos = (blocos?.length ?? 0) > 1;

  return (
    <div
      className="not-verse-text fixed inset-0 z-50 flex items-center justify-center bg-sacred-900/50 p-4 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        ref={painelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ref-modal-titulo"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-parchment-200 bg-parchment-50 shadow-2xl outline-none dark:border-sacred-700 dark:bg-sacred-900"
      >
        <div className="flex items-center justify-between gap-3 border-b border-parchment-200 px-5 py-3 dark:border-sacred-700">
          <h2 id="ref-modal-titulo" className="font-serif text-lg font-semibold text-sacred-800 dark:text-parchment-100">
            {referencia.referencia}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full p-1 text-sacred-500 hover:bg-parchment-200 hover:text-sacred-800 dark:text-parchment-200 dark:hover:bg-sacred-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* overflow-y-auto: a barra de scroll só aparece quando o texto não cabe. */}
        <div className="verse-text overflow-y-auto overscroll-contain px-5 py-4" style={{ fontSize }}>
          {!blocos && !erro && <p className="text-sm text-sacred-400">A carregar...</p>}
          {erro && <p className="text-sm text-sacred-400">Não foi possível obter o texto desta referência.</p>}
          {blocos?.map((b) => (
            <div key={b.capitulo} className="mb-3 last:mb-0">
              {variosCapitulos && (
                <p className="not-verse-text mb-1 text-xs font-semibold uppercase tracking-wide text-gold-600 dark:text-gold-400">
                  Capítulo {b.capitulo}
                </p>
              )}
              {b.versos.map((v) => (
                <p key={v.number} className="mb-1.5 leading-relaxed">
                  <sup className="mr-1 text-xs text-gold-600 dark:text-gold-400">{v.number}</sup>
                  {v.text}
                </p>
              ))}
            </div>
          ))}
          {blocos && (cortado || intervalo.outroLivro) && (
            <p className="not-verse-text mt-2 text-xs text-sacred-400">O intervalo continua - abra o capítulo para ler o resto.</p>
          )}
        </div>

        <div className="flex justify-end border-t border-parchment-200 px-5 py-3 text-sm dark:border-sacred-700">
          <Link
            href={`/biblia/${versao}/${referencia.livro}/${referencia.capitulo}`}
            className="text-sacred-600 hover:text-gold-600 dark:text-parchment-200 dark:hover:text-gold-400"
          >
            Abrir o capítulo completo
          </Link>
        </div>
      </div>
    </div>
  );
}
