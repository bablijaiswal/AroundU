import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectTarget = new URLSearchParams(location.search).get('redirect') || location.state?.from || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email.trim() || !form.password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setGoogleLoading(true);

    try {
      await googleLogin();
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-in failed.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card__header">
          <p className="eyebrow color-brown">Login</p>
          <h1>Welcome back</h1>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <Button variant="primary" fullWidth type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Login'}</Button>
          <Button variant="secondary" fullWidth type="button" onClick={handleGoogleLogin} disabled={googleLoading}>
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </Button>
        </form>
        <div className="auth-meta">
          <span>Need an account?</span>
          <Link className="auth-link" to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
