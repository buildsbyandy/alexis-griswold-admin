import React, { useEffect, useState } from 'react';
import Admin from '../pages/Admin';
import { supabase } from '../lib/supabase/client';

const ALLOWED_EMAILS = import.meta.env.VITE_ALLOWED_ADMIN_EMAILS?.split(',') || [];

const ProtectedAdmin: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check if user is already signed in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      checkAuthorization(session?.user);
      setLoading(false);
    });

    // Listen for auth state changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      checkAuthorization(session?.user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthorization = (user: any) => {
    // Check if user's email is in the allowed list
    if (user?.email && ALLOWED_EMAILS.includes(user.email)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/admin`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B89178] mx-auto"></div>
          <p className="mt-4 text-[#8F907E]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="w-full max-w-md p-8 mx-4 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#383B26] mb-2">Admin Access</h1>
            <p className="text-[#8F907E] mb-6">Please sign in to access the admin panel</p>
            <button
              onClick={signInWithGoogle}
              className="w-full bg-[#B89178] text-white px-6 py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-[#A67B62] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if email not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="w-full max-w-md p-8 mx-4 bg-white rounded-lg shadow-md">
          <div className="text-center">
            <div className="mb-4 text-6xl">🚫</div>
            <h1 className="text-2xl font-bold text-[#383B26] mb-2">Access Denied</h1>
            <p className="text-[#8F907E] mb-4">
              Your email ({user.email}) is not authorized to access this admin panel.
            </p>
            <button
              onClick={signOut}
              className="bg-[#8F907E] text-white px-6 py-2 rounded-lg hover:bg-[#7A7B6A] transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If authorized, show the admin panel with sign out option
  return (
    <div>
      {/* Admin Header with Sign Out */}
      <div className="mb-6 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[#383B26]">Admin Dashboard</h1>
              <p className="text-sm text-[#8F907E]">Welcome, {user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="bg-[#8F907E] text-white px-4 py-2 rounded-lg hover:bg-[#7A7B6A] transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Your existing Admin component - this is where your CMS shows up */}
      <Admin />
    </div>
  );
};

export default ProtectedAdmin;