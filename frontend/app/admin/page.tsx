'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { access_token } = await api.post<{ access_token: string }>('/auth/login', { email, password });
      setToken(access_token);
      router.replace('/admin/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-soft px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6">
        <h1 className="font-serif text-2xl text-primary">Admin Kairos</h1>
        <p className="mt-1 text-sm text-muted">Connectez-vous pour accéder au back-office.</p>
        <div className="mt-4">
          <label className="label">Email</label>
          <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mt-3">
          <label className="label">Mot de passe</label>
          <input required type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <button className="btn btn-primary mt-4 w-full" disabled={loading}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
