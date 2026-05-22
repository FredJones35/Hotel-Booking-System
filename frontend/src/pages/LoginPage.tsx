import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

type Mode = 'login' | 'register' | 'confirm';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', code: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    setLoading(true);
    try {
      if (mode === 'login') {
        const result = await authService.signIn(form.email, form.password);
        if (!result.isSignedIn) {
          throw new Error('Sign-in incomplete. Please check your credentials or confirm your email first.');
        }
        navigate('/');

      } else if (mode === 'register') {
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        await authService.signUp(form.email, form.password);
        setInfo('Account created! A verification code has been sent to your email.');
        setMode('confirm');

      } else if (mode === 'confirm') {
        await authService.confirmSignUp(form.email, form.code);
        setInfo('');
        setError('');
        // Automatically sign in after confirmation
        const result = await authService.signIn(form.email, form.password);
        if (!result.isSignedIn) {
          throw new Error('Auto sign-in failed after confirmation. Please sign in manually.');
        }
        navigate('/');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<Mode, string> = {
    login: 'Sign In',
    register: 'Create Account',
    confirm: 'Verify Your Email',
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          {titles[mode]}
        </h2>

        {mode === 'confirm' && (
          <p className="text-sm text-gray-500 text-center mb-6">
            Enter the 6-digit code sent to <span className="font-medium text-gray-700">{form.email}</span>
          </p>
        )}
        {mode !== 'confirm' && <div className="mb-6" />}

        {info && (
          <div className="mb-4 p-3 border rounded-lg text-sm bg-blue-50 border-blue-200 text-blue-700">
            {info}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 border rounded-lg text-sm bg-red-50 border-red-200 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email — shown on login & register, read-only on confirm */}
          {mode !== 'confirm' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Password — shown on login & register */}
          {mode !== 'confirm' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Confirm Password — shown on register only */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Verification code — shown on confirm only */}
          {mode === 'confirm' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
                placeholder="123456"
                required
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-2 text-center text-xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {loading
              ? 'Loading...'
              : mode === 'login'
              ? 'Sign In'
              : mode === 'register'
              ? 'Create Account'
              : 'Verify & Sign In'}
          </button>
        </form>

        {/* Footer links */}
        {mode === 'confirm' && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Wrong email?{' '}
            <button
              onClick={() => { setMode('register'); setError(''); setInfo(''); }}
              className="text-blue-600 font-medium hover:underline"
            >
              Go back
            </button>
          </p>
        )}
        {mode !== 'confirm' && (
          <p className="mt-4 text-center text-sm text-gray-600">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setInfo(''); }}
              className="text-blue-600 font-medium hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
