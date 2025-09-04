
"use client";

import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { initialAgriculturalSections, type AgriculturalSection } from '@/lib/topics-data';
import { getDocs } from 'firebase/firestore';
import { useAuth } from './auth-context';
import { userSubcollection } from '@/lib/firestore';

interface TopicsContextType {
  topics: AgriculturalSection[];
  setTopics: React.Dispatch<React.SetStateAction<AgriculturalSection[]>>;
  loading: boolean;
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
        if (!user) {
            setLoading(false);
            setTopics([]);
            return;
        }

        setLoading(true);
        try {
            const topicsCollectionRef = userSubcollection<Omit<AgriculturalSection, 'id'>>('data');
            const querySnapshot = await getDocs(topicsCollectionRef);
            
            if (querySnapshot.empty) {
                // This case should be handled by the initial provisioning in AuthContext,
                // but as a fallback, we use the local data.
                setTopics(initialAgriculturalSections);
            } else {
                const fetchedTopics: AgriculturalSection[] = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as AgriculturalSection[];
                setTopics(fetchedTopics);
            }
        } catch (error) {
            console.error("Error fetching topics for user, falling back to initial data: ", error);
            // Fallback to initial data if there's any other error
            setTopics(initialAgriculturalSections);
        } finally {
            setLoading(false);
        }
    };

    if (!authLoading) {
        fetchTopics();
    }
  }, [user, authLoading]);

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
