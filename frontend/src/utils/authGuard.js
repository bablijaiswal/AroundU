export function requireAuth({ user, navigate, location, message = 'Please sign in to continue.' }) {
  if (user) return true;

  const next = `${location.pathname}${location.search}`;
  if (typeof window !== 'undefined') {
    window.alert(message);
  }
  navigate(`/login?redirect=${encodeURIComponent(next)}`, { replace: true });
  return false;
}
