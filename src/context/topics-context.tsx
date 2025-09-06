
"use client";

import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { initialAgriculturalSections, type AgriculturalSection } from '@/lib/topics-data';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';

interface TopicsContextType {
  topics: AgriculturalSection[];
  loading: boolean;
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If there's no user, we can fall back to initial data or show nothing.
    // Let's use initial data for now so guests can see something.
    if (!user) {
      setTopics(initialAgriculturalSections);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Path is now inside the user's document
    const topicsCollectionRef = collection(db, 'users', user.uid, 'topics');
    
    const unsubscribe = onSnapshot(topicsCollectionRef, (snapshot) => {
        if (!snapshot.empty) {
            const fetchedTopics: AgriculturalSection[] = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })) as AgriculturalSection[];
            
            setTopics(fetchedTopics);
        } else {
             // If the user has no topics of their own, maybe show the initial ones?
             setTopics(initialAgriculturalSections);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching user topics, falling back to initial data: ", error);
        setTopics(initialAgriculturalSections);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const value = useMemo(() => ({ topics, loading }), [topics, loading]);

  return (
    <TopicsContext.Provider value={value}>
      {children}
    </TopicsContext.Provider>
  );
};

export const useTopics = () => {
  const context = useContext(TopicsContext);
  if (context === undefined) {
    throw new Error('useTopics must be used within a TopicsProvider');
  }
  return context;
};

    