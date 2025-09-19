import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase.generated'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const serviceKey = process.env.SUPABASE_SECRET_KEY as string

if (!supabaseUrl) throw new Error('Missing env NEXT_PUBLIC_SUPABASE_URL for Supabase client')
if (!serviceKey) throw new Error('Missing env SUPABASE_SECRET_KEY for Supabase service client')

export const supabase = createClient<Database>(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export default supabase


