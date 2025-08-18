
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { initialAgriculturalSections, type AgriculturalSection } from '@/lib/topics-data';

interface TopicsContextType {
  topics: AgriculturalSection[];
  setTopics: React.Dispatch<React.SetStateAction<AgriculturalSection[]>>;
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedTopics = localStorage.getItem('agriculturalSections');
      if (storedTopics) {
        setTopics(JSON.parse(storedTopics));
      } else {
        setTopics(initialAgriculturalSections);
      }
    } catch (error) {
        console.error("Failed to parse or set data in localStorage:", error);
        setTopics(initialAgriculturalSections);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem('agriculturalSections', JSON.stringify(topics));
        } catch (error) {
            console.error("Failed to save data to localStorage:", error);
        }
    }
  }, [topics, isLoaded]);

  const value = useMemo(() => ({ topics, setTopics }), [topics, setTopics]);

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
