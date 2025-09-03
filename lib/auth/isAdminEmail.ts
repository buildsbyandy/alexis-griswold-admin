export const isAdminEmail = (email?: string | null) => {
  if (!email) return false
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.toLowerCase())
}

export default isAdminEmail

