
"use client";

import React, { createContext, useState, useContext, useMemo } from 'react';
import { initialAgriculturalSections, type AgriculturalSection } from '@/lib/topics-data';

interface TopicsContextType {
  topics: AgriculturalSection[];
  setTopics: React.Dispatch<React.SetStateAction<AgriculturalSection[]>>;
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topics, setTopics] = useState<AgriculturalSection[]>(initialAgriculturalSections);
  
  // Note: For simplicity and to resolve hydration/loading issues,
  // we are no longer persisting changes to localStorage.
  // Changes made by the admin will only exist in memory for the current session.
  // A proper database would be needed for permanent storage.

  const value = useMemo(() => ({ topics, setTopics }), [topics]);

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
