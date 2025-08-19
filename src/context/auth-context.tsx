
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AppUser extends User {
  role?: string;
  name?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser as AppUser | null);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
      const fetchUserData = async () => {
          if (user && !user.role) { // Fetch only if user exists and role is not yet set
              const userDocRef = doc(db, 'users', user.uid);
              try {
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setUser(currentUser => currentUser ? {
                        ...currentUser,
                        role: userData.role,
                        name: userData.name || currentUser.displayName,
                    } : null);
                }
              } catch (error) {
                  console.error("Failed to fetch user document:", error);
                  // Handle cases where firestore might be offline initially
                  // We don't want to block the app, role can be fetched later.
              }
          }
      };

      fetchUserData();
  }, [user?.uid]); // Rerun when user.uid changes

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
