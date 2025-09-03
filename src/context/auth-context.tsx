
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.Node }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            
            const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
                setLoading(true);
                const userData = doc.data();
                const combinedUser: AppUser = {
                    ...firebaseUser,
                    ...userData,
                    uid: firebaseUser.uid, // Ensure uid from auth is always present
                    displayName: userData?.name || firebaseUser.displayName,
                    name: userData?.name || firebaseUser.displayName,
                    photoURL: userData?.photoURL || firebaseUser.photoURL,
                };
                setUser(combinedUser);
                setLoading(false);
            }, (error) => {
                console.error("Error with onSnapshot:", error);
                setUser(firebaseUser as AppUser); // Fallback to auth user
                setLoading(false);
            });

            return () => unsubscribeSnapshot(); // Cleanup snapshot listener
        } else {
            setUser(null);
            setLoading(false);
        }
    });

    return () => unsubscribeAuth(); // Cleanup auth listener
  }, []);


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
