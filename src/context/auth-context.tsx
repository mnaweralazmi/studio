
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { initialAgriculturalSections } from '@/lib/topics-data';
import { collection } from 'firebase/firestore';


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


async function provisionInitialUserData(uid: string) {
    const dataCollectionRef = collection(db, "users", uid, "data");
    const existingData = await getDocs(dataCollectionRef);

    if (existingData.empty) {
        const batch = writeBatch(db);
        initialAgriculturalSections.forEach(topic => {
            const docRef = doc(dataCollectionRef, topic.id);
            batch.set(docRef, topic);
        });
        await batch.commit();
    }
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: Unsubscribe | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        // Provision initial topics if they don't exist for the user
        await provisionInitialUserData(firebaseUser.uid);
        
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
          const userData = doc.data();
          const combinedUser: AppUser = {
            ...firebaseUser,
            ...userData,
            uid: firebaseUser.uid,
            displayName: userData?.name || firebaseUser.displayName,
            name: userData?.name || firebaseUser.displayName,
            photoURL: userData?.photoURL || firebaseUser.photoURL,
          };
          setUser(combinedUser);
          setLoading(false);
        }, (error) => {
          console.error("Error with onSnapshot, falling back to auth user:", error);
          setUser(firebaseUser as AppUser);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
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
