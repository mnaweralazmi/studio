
"use client";

import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { initialAgriculturalSections, type AgriculturalSection } from '@/lib/topics-data';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';


interface TopicsContextType {
  topics: AgriculturalSection[];
  setTopics: React.Dispatch<React.SetStateAction<AgriculturalSection[]>>;
  loading: boolean;
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
        setLoading(true);
        try {
            const topicsCollectionRef = collection(db, 'data');
            const querySnapshot = await getDocs(topicsCollectionRef);
            
            if (querySnapshot.empty) {
                // If firestore is empty, use local initial data without writing to firestore.
                // This prevents permission errors if rules are read-only for clients.
                setTopics(initialAgriculturalSections);
            } else {
                const fetchedTopics: AgriculturalSection[] = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as AgriculturalSection[];
                setTopics(fetchedTopics);
            }
        } catch (error) {
            console.error("Error fetching topics, falling back to initial data: ", error);
            // Fallback to initial data if there's any other error
            setTopics(initialAgriculturalSections);
        } finally {
            setLoading(false);
        }
    };

    fetchTopics();
  }, []);

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
