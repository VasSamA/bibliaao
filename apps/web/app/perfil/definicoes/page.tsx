'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

export default function DefinicoesPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.newPassword !== form.confirmPassword) {
      setError('A confirmação não corresponde à nova senha.');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/utilizadores/perfil/senha', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Senha alterada com sucesso.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.message ?? 'Não foi possível alterar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <Link href="/perfil" className="text-sm text-sacred-500 hover:text-gold-600">
        ← Voltar ao perfil
      </Link>
      <h1 className="font-serif text-3xl font-semibold mt-4 mb-6">Definições</h1>

      <h2 className="font-medium mb-4">Alterar senha</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Senha atual</label>
          <input
            type="password"
            required
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className="w-full rounded-lg border border-sacred-200 dark:border-sacred-700 bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Nova senha (mín. 8 caracteres)</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full rounded-lg border border-sacred-200 dark:border-sacred-700 bg-transparent px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Confirmar nova senha</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full rounded-lg border border-sacred-200 dark:border-sacred-700 bg-transparent px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}
        <button
          disabled={loading}
          className="w-full rounded-full bg-sacred-600 py-2.5 text-white hover:bg-sacred-700 disabled:opacity-60"
        >
          {loading ? 'A guardar...' : 'Guardar nova senha'}
        </button>
      </form>
    </div>
  );
}
