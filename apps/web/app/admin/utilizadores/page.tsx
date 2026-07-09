export const metadata = { title: 'Utilizadores — Painel Administrativo' };

export default function UtilizadoresPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold mb-4">Utilizadores</h1>
      <p className="text-sm text-sacred-500">
        Gestão de utilizadores — ligado aos endpoints protegidos correspondentes em apps/api
        (ver docs/API.md). Interface de tabela/formulário completa fica para a próxima iteração.
      </p>
    </div>
  );
}
