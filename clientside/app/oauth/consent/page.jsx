'use client';

import { useEffect } from 'react';
import { createClient } from '../../../lib/supabase/clients';

export default function Check() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
  }, []);

  return (
    <h1>This is pretty gay!</h1>
  );
}