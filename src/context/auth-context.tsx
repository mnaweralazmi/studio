
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
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
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  setUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
             setUser(currentUser => currentUser ? ({
                ...currentUser,
                ...userData,
                 displayName: userData.name || firebaseUser.displayName,
                 photoURL: userData.photoURL || firebaseUser.photoURL,
            } as AppUser) : null);
        }
    }
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            // Use onSnapshot for real-time updates
            const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const userData = doc.data();
                     setUser({
                        ...firebaseUser, // This includes uid, email, etc. from auth
                        ...userData, // This includes role, points, level, etc. from firestore
                        displayName: userData.name || firebaseUser.displayName, // Prioritize firestore name
                        name: userData.name || firebaseUser.displayName, // also set name property
                        photoURL: userData.photoURL || firebaseUser.photoURL, // Prioritize firestore photo
                    } as AppUser);
                } else {
                   // Handle case where user exists in Auth but not Firestore (e.g., during registration)
                   setUser(firebaseUser as AppUser);
                }
                setLoading(false);
            }, (error) => {
                console.error("Error fetching user data with onSnapshot:", error);
                setUser(firebaseUser as AppUser); // Fallback to auth user data on error
                setLoading(false);
            });
            
            return () => unsubscribeSnapshot(); // Cleanup snapshot listener on unmount or user change
        } else {
            setUser(null);
            setLoading(false);
        }
    });

    return () => unsubscribeAuth(); // Cleanup auth state listener
  }, []);


  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, setUser }}>
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
