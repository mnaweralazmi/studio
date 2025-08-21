
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface Badge {
    id: 'explorer' | 'planner' | 'trader';
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

export interface AppUser extends User {
  role?: string;
  name?: string;
  points?: number;
  level?: number;
  badges?: ('explorer' | 'planner' | 'trader')[];
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
             setUser(currentUser => currentUser ? {
                ...currentUser,
                ...userData,
            } : null);
        }
    }
  }

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const userData = doc.data();
                     setUser({
                        ...firebaseUser,
                        ...userData
                    } as AppUser);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user data:", error);
                setUser(firebaseUser as AppUser); // Set basic user info even if firestore fails
                setLoading(false);
            });
            return () => unsubscribeSnapshot();
        } else {
            setUser(null);
            setLoading(false);
        }
    });

    return () => unsubscribeAuth();
  }, []);


  return (
    <AuthContext.Provider value={{ user, loading, refreshUser }}>
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
