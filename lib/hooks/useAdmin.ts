'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, adminUids } from '@/lib/firebase';
import { useMemo } from 'react';

export function useAdmin() {
  const [user, loading] = useAuthState(auth);

  const isAdmin = useMemo(() => {
    if (loading || !user) {
      return false;
    }
    return adminUids.includes(user.uid);
  }, [user, loading]);

  return { isAdmin, loading };
}
