
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { initialAgriculturalSections } from '@/lib/topics-data';
import { collection, writeBatch } from 'firebase/firestore';


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

// This function runs once to provision the initial topics in the root /data collection
// if it doesn't already exist.
async function provisionInitialTopics() {
    const dataCollectionRef = collection(db, "data");
    const docSnap = await getDoc(doc(dataCollectionRef, initialAgriculturalSections[0].id));

    if (!docSnap.exists()) {
        const batch = writeBatch(db);
        initialAgriculturalSections.forEach(topic => {
            const docRef = doc(dataCollectionRef, topic.id);
            batch.set(docRef, topic);
        });
        await batch.commit();
        console.log("Initial agricultural topics have been provisioned.");
    }
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: Unsubscribe | null = null;
    
    // Provision topics on app start
    provisionInitialTopics();

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        setLoading(true); // Set loading while we fetch Firestore data
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
          const userData = doc.data();
          const combinedUser: AppUser = {
            ...firebaseUser,
            // Ensure properties from both sources are merged correctly
            name: userData?.name || firebaseUser.displayName || undefined,
            displayName: userData?.name || firebaseUser.displayName || undefined,
            photoURL: userData?.photoURL || firebaseUser.photoURL || undefined,
            // Spread the rest of the userData
            ...(userData || {}),
          };
          setUser(combinedUser);
          setLoading(false);
        }, (error) => {
          console.error("Error with onSnapshot, falling back to auth user:", error);
          // IMPORTANT: Still set the user, even if Firestore fails
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
