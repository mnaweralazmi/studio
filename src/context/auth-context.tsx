
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// Simplified user type
export type AppUser = User & DocumentData;

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
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // If we have a user, listen for their data in Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            // If the document exists, merge Firestore data with auth data
            const firestoreData = docSnap.data();
            setUser({ ...firebaseUser, ...firestoreData });
          } else {
            // If Firestore document doesn't exist (e.g., new user), use basic auth data
            // The document will be created on registration or first login
            setUser(firebaseUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user document from Firestore:", error);
          // On error, fall back to basic auth user to prevent app crash
          setUser(firebaseUser);
          setLoading(false);
        });

        // Return the snapshot listener's unsubscribe function
        return () => unsubscribeSnapshot();
        
      } else {
        // No user is signed in
        setUser(null);
        setLoading(false);
      }
    });

    // Return the auth listener's unsubscribe function
    return () => unsubscribeAuth();
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
