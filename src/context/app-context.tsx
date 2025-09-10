"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot, Unsubscribe, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useLanguage } from './language-context';
import { Leaf } from "lucide-react";

export interface UserProfile {
  name?: string;
  role?: "admin" | "user";
  points?: number;
  level?: number;
  badges?: string[];
  photoURL?: string;
  [key: string]: any;
}

export interface User extends FirebaseUser, UserProfile {}

interface AppContextType {
  user: User | null;
  loading: boolean;
}

const AppContext = createContext<AppContextType>({
  user: null,
  loading: true,
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribe) {
        unsubscribe();
      }

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        unsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const userProfile = docSnap.data() as UserProfile;
            // Convert Timestamps to Dates
            const profileWithDates = Object.fromEntries(
              Object.entries(userProfile).map(([key, value]) =>
                value instanceof Timestamp ? [key, value.toDate()] : [key, value]
              )
            );
            setUser({ ...firebaseUser, ...profileWithDates });
          } else {
             // This might happen briefly during user creation
            setUser(firebaseUser as User);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user document:", error);
          setUser(firebaseUser as User);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Leaf className="h-20 w-20 text-primary" />
          <p className="text-lg text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ user, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  return useContext(AppContext);
};