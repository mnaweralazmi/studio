
"use client";

import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { initialAgriculturalSections, type AgriculturalSection } from '@/lib/topics-data';
import { collection, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './auth-context';

interface TopicsContextType {
  topics: AgriculturalSection[];
  setTopics: React.Dispatch<React.SetStateAction<AgriculturalSection[]>>;
  loading: boolean;
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    const topicsCollectionRef = collection(db, 'data');
    
    const unsubscribe = onSnapshot(topicsCollectionRef, (querySnapshot) => {
        if (!querySnapshot.empty) {
            const fetchedTopics: AgriculturalSection[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AgriculturalSection[];
            
            // This ensures all global topics are included, plus any user-specific ones.
            const userTopics = fetchedTopics.filter(topic => !topic.ownerId || (user && topic.ownerId === user.uid));
            setTopics(userTopics);

        } else {
             // If the 'data' collection is empty, fall back to initial static data.
             setTopics(initialAgriculturalSections);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching topics, falling back to initial data: ", error);
        setTopics(initialAgriculturalSections);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const value = useMemo(() => ({ topics, setTopics, loading }), [topics, loading]);

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

    