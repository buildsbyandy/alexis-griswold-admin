import { useState, useEffect } from 'react';
import { supabase, isAdminUser } from '../lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

/**
 * Custom hook to check if the current user is authenticated as an admin
 * @returns Object containing user, isAdmin status, and loading state
 */
export const useAdminAuth = (): AdminAuthState => {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    const checkAdminStatus = async () => {
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setState({ user: null, isAdmin: false, loading: false });
          }
          return;
        }

        const user = session?.user || null;
        
        // Check if user is admin
        const isAdmin = user ? await isAdminUser() : false;
        
        if (mounted) {
          setState({ user, isAdmin, loading: false });
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (mounted) {
          setState({ user: null, isAdmin: false, loading: false });
        }
      }
    };

    // Initial check
    checkAdminStatus();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      const user = session?.user || null;
      
      if (user) {
        try {
          const isAdmin = await isAdminUser();
          setState({ user, isAdmin, loading: false });
        } catch (error) {
          console.error('Error checking admin status on auth change:', error);
          setState({ user, isAdmin: false, loading: false });
        }
      } else {
        setState({ user: null, isAdmin: false, loading: false });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return state;
};
