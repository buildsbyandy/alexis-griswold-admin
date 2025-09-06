/**
 * Supabase Admin Client Configuration
 * 
 * Server-side Supabase client with elevated permissions for admin operations.
 * This should only be used in API routes and server-side functions.
 */

import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/supabase'

// Environment variables validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.VITE_SUPABASE_URL')
}

if (!supabaseSecretKey) {
  throw new Error('Missing env.VITE_SUPABASE_SERVICE_ROLE_KEY')
}

// Create admin Supabase client with service role key
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Helper function to set admin emails configuration
export const setAdminEmails = async (emails: string[]) => {
  const emailsString = emails.join(',')
  
  // Note: set_config RPC function not available in current schema
  // This would need to be implemented in the database first
  console.log('Admin emails would be set to:', emailsString)
  
  // For now, we rely on environment variables for admin emails
  return true
}

// Helper function to verify admin access
export const verifyAdminAccess = async (userEmail: string) => {
  const adminEmails = import.meta.env.VITE_ALLOWED_ADMIN_EMAILS?.split(',') || []
  
  if (!adminEmails.includes(userEmail)) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  return true
}

// Helper function for admin-only database operations
export const withAdminAccess = async <T>(
  userEmail: string,
  operation: () => Promise<T>
): Promise<T> => {
  await verifyAdminAccess(userEmail)
  return await operation()
}

export default supabaseAdmin