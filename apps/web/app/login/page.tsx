'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await api.post<{ accessToken: string; refreshToken: string }>('/auth/login', { email, password });
      localStorage.setItem('biblia_access_token', accessToken);
      localStorage.setItem('biblia_refresh_token', refreshToken);
      router.push('/perfil');
    } catch (err: any) {
      setError(err.message ?? 'Não foi possível iniciar sessão.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl font-semibold mb-6 text-center">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">E-mail</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-sacred-200 dark:border-sacred-700 bg-transparent px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">Senha</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-sacred-200 dark:border-sacred-700 bg-transparent px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} className="w-full rounded-full bg-sacred-600 py-2.5 text-white hover:bg-sacred-700 disabled:opacity-60">
          {loading ? 'A entrar...' : 'Entrar'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        Ainda não tens conta? <a href="/registo" className="text-gold-600 dark:text-gold-400">Regista-te</a>
      </p>
    </div>
  );
}
