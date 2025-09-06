
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
    
    const processSnapshot = (snapshot: any) => {
        if (!snapshot.empty) {
            const fetchedTopics: AgriculturalSection[] = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data()
            })) as AgriculturalSection[];
            
            const userTopics = fetchedTopics.filter(topic => !topic.ownerId || (user && topic.ownerId === user.uid));
            setTopics(userTopics);
        } else {
             setTopics(initialAgriculturalSections);
        }
        setLoading(false);
    };
    
    const handleError = (error: any) => {
        console.error("Error fetching topics, falling back to initial data: ", error);
        setTopics(initialAgriculturalSections);
        setLoading(false);
    };

    const unsubscribe = onSnapshot(topicsCollectionRef, processSnapshot, handleError);

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

    