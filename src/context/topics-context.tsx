
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { initialAgriculturalSections, initialVideoSections, type AgriculturalSection, type VideoSection } from '@/lib/topics-data';

interface TopicsContextType {
  topics: AgriculturalSection[];
  setTopics: React.Dispatch<React.SetStateAction<AgriculturalSection[]>>;
  videos: VideoSection[];
  setVideos: React.Dispatch<React.SetStateAction<VideoSection[]>>;
}

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  const [videos, setVideos] = useState<VideoSection[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedTopics = localStorage.getItem('agriculturalSections');
      if (storedTopics) {
        setTopics(JSON.parse(storedTopics));
      } else {
        setTopics(initialAgriculturalSections);
        localStorage.setItem('agriculturalSections', JSON.stringify(initialAgriculturalSections));
      }

      const storedVideos = localStorage.getItem('videoSections');
      if(storedVideos) {
          setVideos(JSON.parse(storedVideos));
      } else {
          setVideos(initialVideoSections);
          localStorage.setItem('videoSections', JSON.stringify(initialVideoSections));
      }

    } catch (error) {
        console.error("Failed to parse or set data in localStorage:", error);
        setTopics(initialAgriculturalSections);
        setVideos(initialVideoSections);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem('agriculturalSections', JSON.stringify(topics));
            localStorage.setItem('videoSections', JSON.stringify(videos));
        } catch (error) {
            console.error("Failed to save data to localStorage:", error);
        }
    }
  }, [topics, videos, isLoaded]);

  const value = useMemo(() => ({ topics, setTopics, videos, setVideos }), [topics, videos]);

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

    