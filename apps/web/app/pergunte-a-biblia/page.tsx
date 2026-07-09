'use client';

import { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { api } from '../../lib/api';

type Answer = { answer: string; referencesUsed: string[] };

export default function PerguntaBibliaPage() {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<{ question: string; answer: Answer }[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const answer = await api.post<Answer>('/pergunte-a-biblia', { question });
      setHistory((h) => [...h, { question, answer }]);
      setQuestion('');
    } catch (err: any) {
      setHistory((h) => [...h, { question, answer: { answer: `Erro: ${err.message}`, referencesUsed: [] } }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="text-gold-500" />
        <h1 className="font-serif text-3xl font-semibold">Pergunte à Bíblia</h1>
      </div>
      <p className="mb-8 text-sm text-sacred-600 dark:text-parchment-200">
        Faz uma pergunta e recebe uma resposta fundamentada em versículos e estudos aprovados —
        sempre com as referências bíblicas usadas, para leres na íntegra. A IA não substitui a
        Bíblia: ajuda-te a encontrá-la e compreendê-la melhor.
      </p>

      <div className="space-y-6 mb-8">
        {history.map((item, i) => (
          <div key={i} className="space-y-2">
            <p className="font-medium">{item.question}</p>
            <div className="rounded-xl bg-sacred-50 dark:bg-sacred-800 p-4 text-sm leading-relaxed">
              <p>{item.answer.answer}</p>
              {item.answer.referencesUsed?.length > 0 && (
                <p className="mt-3 text-xs text-gold-600 dark:text-gold-400">
                  Referências: {item.answer.referencesUsed.join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex: O que a Bíblia diz sobre a ansiedade?"
          className="flex-1 rounded-full border border-sacred-200 dark:border-sacred-700 bg-transparent px-4 py-2.5"
        />
        <button disabled={loading} className="rounded-full bg-sacred-600 p-2.5 text-white hover:bg-sacred-700 disabled:opacity-60">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
