/**
 * Supabase Client Configuration
 * 
 * Browser-safe Supabase client for frontend operations.
 * This replaces the mock database with real Supabase connection.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/supabase'

// Environment variables (browser-safe)
// Use Vite-style import.meta.env only; do not reference process.env in the browser.
const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('Missing env.VITE_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  console.error('Missing env.VITE_SUPABASE_ANON_KEY')
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error)
  
  if (error?.code === 'PGRST116') {
    return 'No data found'
  }
  
  if (error?.code === 'PGRST301') {
    return 'Unauthorized access'
  }
  
  if (error?.message) {
    return error.message
  }
  
  return 'An unexpected error occurred'
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return !error && !!user
}

// Helper function to check if user is admin
export const isAdminUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user?.email) {
    return false
  }
  
  // Get admin emails from environment or database configuration
  const adminEmails = (import.meta.env.VITE_ALLOWED_ADMIN_EMAILS || '')
    .split(',')
    .filter(Boolean)
  
  return adminEmails.includes(user.email)
}

// Storage helpers
export const getPublicUrl = (path: string) => {
  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return data.publicUrl
}

export const uploadFile = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from('media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) {
    throw new Error(handleSupabaseError(error))
  }
  
  return {
    path: data.path,
    url: getPublicUrl(data.path)
  }
}

export const deleteFile = async (path: string) => {
  const { error } = await supabase.storage
    .from('media')
    .remove([path])
  
  if (error) {
    throw new Error(handleSupabaseError(error))
  }
  
  return true
}

export default supabase