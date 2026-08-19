import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { ArrowLeft, Loader2, LogIn, UserPlus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = searchParams.get('from') || '/home';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      navigate(from);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout showNav={false} showSOS={false}>
      <div className="px-4 py-3 max-w-sm mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white">
            <ArrowLeft size={20} className="text-[#1A1A2E]" />
          </button>
          <h1 className="font-display text-xl font-bold text-[#1A1A2E]">
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </h1>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl text-sm font-body font-medium transition-colors ${
              mode === 'login' ? 'bg-[#003F87] text-white' : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl text-sm font-body font-medium transition-colors ${
              mode === 'register' ? 'bg-[#003F87] text-white' : 'bg-white border border-[#D4C5A9]/30 text-[#1A1A2E]/70'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-[#D4C5A9]/20 shadow-sm space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-xs font-body text-[#1A1A2E]/60 mb-1 block">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#FAF8F5] rounded-xl px-3 py-2.5 text-sm font-body outline-none border border-[#D4C5A9]/30"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-body text-[#1A1A2E]/60 mb-1 block">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-[#FAF8F5] rounded-xl px-3 py-2.5 text-sm font-body outline-none border border-[#D4C5A9]/30"
            />
          </div>
          <div>
            <label className="text-xs font-body text-[#1A1A2E]/60 mb-1 block">Password</label>
            <input
              type="password"
              required
              minLength={mode === 'register' ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
              className="w-full bg-[#FAF8F5] rounded-xl px-3 py-2.5 text-sm font-body outline-none border border-[#D4C5A9]/30"
            />
          </div>

          {error && <p className="text-xs font-body text-[#C0392B]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#003F87] text-white py-3 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : mode === 'login' ? (
              <LogIn size={16} />
            ) : (
              <UserPlus size={16} />
            )}
            {mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
