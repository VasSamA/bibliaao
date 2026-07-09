export const metadata = { title: 'Igrejas — Painel Administrativo' };

export default function IgrejasPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold mb-4">Igrejas</h1>
      <p className="text-sm text-sacred-500">
        Gestão de igrejas — ligado aos endpoints protegidos correspondentes em apps/api
        (ver docs/API.md). Interface de tabela/formulário completa fica para a próxima iteração.
      </p>
    </div>
  );
}
