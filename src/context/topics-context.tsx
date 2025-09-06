
"use client";

import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { type AgriculturalSection } from '@/lib/topics-data';
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
    setLoading(true);
    // Public data is in the root 'data' collection
    const topicsCollectionRef = collection(db, 'data');
    
    const unsubscribe = onSnapshot(topicsCollectionRef, (snapshot) => {
        if (!snapshot.empty) {
            const fetchedTopics: AgriculturalSection[] = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })) as AgriculturalSection[];
            
            setTopics(fetchedTopics);
        } else {
             setTopics([]);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching public topics: ", error);
        setTopics([]); // Set to empty on error
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
