'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function RegistoPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/registo', form);
      localStorage.setItem('biblia_access_token', accessToken);
      localStorage.setItem('biblia_refresh_token', refreshToken);
      router.push('/perfil');
    } catch (err: any) {
      setError(err.message ?? 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-6 text-center">Criar conta</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-sacred-200 dark:border-sacred-700 bg-transparent px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-sacred-200 dark:border-sacred-700 bg-transparent px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Senha (mín. 8 caracteres)</label>
          <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-sacred-200 dark:border-sacred-700 bg-transparent px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-full bg-sacred-600 py-2.5 text-white hover:bg-sacred-700 disabled:opacity-60">
          {loading ? 'A criar conta...' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        Já tens conta? <a href="/login" className="text-gold-600 dark:text-gold-400">Entra aqui</a>
      </p>
    </div>
  );
}
