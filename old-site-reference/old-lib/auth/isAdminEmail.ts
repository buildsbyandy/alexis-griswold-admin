export const isAdminEmail = (email?: string | null) => {
  if (!email) return false;
  const allowed = (import.meta.env.VITE_ALLOWED_ADMIN_EMAILS || '')
    .split(',')
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
};


