"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  doc,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type UserProfile = {
  name?: string;
  role?: "admin" | "user";
  points?: number;
  level?: number;
  badges?: string[];
  photoURL?: string;
  [key: string]: any;
};

export interface User extends FirebaseUser, UserProfile {}

interface AppContextType {
  user: User | null;
  loading: boolean;
}

const AppContext = createContext<AppContextType>({
  user: null,
  loading: true,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userProfileUnsubscribe: Unsubscribe | undefined;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (userProfileUnsubscribe) {
        userProfileUnsubscribe();
      }

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        userProfileUnsubscribe = onSnapshot(userDocRef, (userDocSnap) => {
          const userProfile = userDocSnap.exists() ? (userDocSnap.data() as UserProfile) : {};
          
          const profileWithDates = Object.fromEntries(
            Object.entries(userProfile).map(([key, value]) =>
              value instanceof Timestamp ? [key, value.toDate()] : [key, value]
            )
          );

          setUser({ ...firebaseUser, ...profileWithDates });
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
      if (userProfileUnsubscribe) {
        userProfileUnsubscribe();
      }
    };
  }, []);

  return (
    <AppContext.Provider value={{ user, loading }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  return useContext(AppContext);
};