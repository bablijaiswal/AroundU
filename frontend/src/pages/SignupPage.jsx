import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, googleLogin } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectTarget = new URLSearchParams(location.search).get('redirect') || location.state?.from || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Name is required.');
    if (!form.email.trim() || !form.password.trim()) return setError('Please enter all required fields.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError('Enter a valid email address.');
    if (form.password.length < 6) return setError('Password should be at least 6 characters long.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await signup({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create your account.');
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
          <p className="eyebrow color-brown">Sign Up</p>
          <h1>Create your account</h1>
        </div>
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="field">
            <label>Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Create a password" required />
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Confirm password" required />
          </div>
          {error && <p className="auth-error">{error}</p>}
          <Button variant="primary" fullWidth type="submit" disabled={loading}>{loading ? 'Creating account…' : 'Create account'}</Button>
          <Button variant="secondary" fullWidth type="button" onClick={handleGoogleLogin} disabled={googleLoading}>
            {googleLoading ? 'Connecting…' : 'Continue with Google'}
          </Button>
        </form>
        <div className="auth-meta">
          <span>Already have an account?</span>
          <Link className="auth-link" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
