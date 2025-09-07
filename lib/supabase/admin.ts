import 'server-only'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SECRET_KEY as string

if (!supabaseUrl) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!serviceKey) throw new Error('Missing SUPABASE_SECRET_KEY')

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { headers: { 'x-allowed-admin-emails': process.env.ALLOWED_ADMIN_EMAILS || '' } },
})

export default supabaseAdmin

