import type { ReactNode } from 'react';

/**
 * Desenha o corpo de um estudo a partir de texto simples com um subconjunto de
 * Markdown: `##`/`###` (títulos), `- ` (listas), `> ` (texto bíblico citado),
 * `**negrito**` e `*itálico*`. Nunca interpreta HTML: tudo passa pelo React.
 */
type Bloco =
  | { tipo: 'h2' | 'h3' | 'p'; texto: string }
  | { tipo: 'ul'; itens: string[] }
  | { tipo: 'quote'; texto: string };

function lerBlocos(corpo: string): Bloco[] {
  const blocos: Bloco[] = [];
  let paragrafo: string[] = [];
  let lista: string[] = [];
  let citacao: string[] = [];

  const fechar = () => {
    if (paragrafo.length) blocos.push({ tipo: 'p', texto: paragrafo.join(' ') });
    if (lista.length) blocos.push({ tipo: 'ul', itens: lista });
    if (citacao.length) blocos.push({ tipo: 'quote', texto: citacao.join(' ') });
    paragrafo = [];
    lista = [];
    citacao = [];
  };

  for (const linha of corpo.replace(/\r\n/g, '\n').split('\n')) {
    const t = linha.trim();
    const h = /^(##|###)\s+(.+)$/.exec(t);
    const li = /^[-*]\s+(.+)$/.exec(t);
    const q = /^>\s?(.*)$/.exec(t);
    if (!t) {
      fechar();
    } else if (h) {
      fechar();
      blocos.push({ tipo: h[1] === '##' ? 'h2' : 'h3', texto: h[2] });
    } else if (li) {
      if (paragrafo.length || citacao.length) fechar();
      lista.push(li[1]);
    } else if (q) {
      if (paragrafo.length || lista.length) fechar();
      citacao.push(q[1]);
    } else {
      if (lista.length || citacao.length) fechar();
      paragrafo.push(t);
    }
  }
  fechar();
  return blocos;
}

function inline(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((parte, i) => {
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
      return <strong key={i}>{parte.slice(2, -2)}</strong>;
    }
    if (parte.startsWith('*') && parte.endsWith('*') && parte.length > 2) {
      return <em key={i}>{parte.slice(1, -1)}</em>;
    }
    return parte;
  });
}

export function ConteudoEstudo({ corpo }: { corpo: string }) {
  const blocos = lerBlocos(corpo);
  return (
    <div className="space-y-5 text-base leading-relaxed text-sacred-800 dark:text-parchment-100">
      {blocos.map((b, i) => {
        switch (b.tipo) {
          case 'h2':
            return (
              <h2 key={i} className="pt-4 font-serif text-2xl font-semibold text-sacred-900 dark:text-parchment-50">
                {inline(b.texto)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="pt-2 font-serif text-xl font-semibold text-sacred-900 dark:text-parchment-50">
                {inline(b.texto)}
              </h3>
            );
          case 'ul':
            return (
              <ul key={i} className="list-disc space-y-1 pl-6">
                {b.itens.map((item, j) => (
                  <li key={j}>{inline(item)}</li>
                ))}
              </ul>
            );
          case 'quote':
            return (
              <blockquote
                key={i}
                className="border-l-4 border-gold-500 bg-parchment-100 px-5 py-3 font-serif text-lg italic text-sacred-900 dark:bg-sacred-800 dark:text-parchment-50"
              >
                {inline(b.texto)}
              </blockquote>
            );
          default:
            return <p key={i}>{inline(b.texto)}</p>;
        }
      })}
    </div>
  );
}
