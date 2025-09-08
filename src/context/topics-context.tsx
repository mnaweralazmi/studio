
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onSnapshot,
  collection,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Unsubscribe,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import type { AgriculturalSection } from "@/lib/types";

type Topic = AgriculturalSection;

type TopicsContextType = {
  topics: Topic[];
  topicsLoading: boolean;
  topicsError: string | null;
  addTopic: (data: Omit<Topic, "id" | "subTopics" | "videos" | "ownerId">) => Promise<string>;
  deleteTopic: (id: string) => Promise<void>;
};

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState<boolean>(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  useEffect(() => {
    setTopicsLoading(true);
    setTopicsError(null);
    
    // We fetch public topics here, no user needed
    const topicsColRef = collection(db, "data");
    const q = query(topicsColRef); // In a real app, you might filter for public topics

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items: Topic[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Topic));
        setTopics(items);
        setTopicsLoading(false);
      },
      (err) => {
        console.error("data onSnapshot error:", err);
        setTopicsError(err?.message ?? "خطأ في جلب المواضيع");
        setTopics([]);
        setTopicsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Functions for adding/deleting topics should still be protected
  async function addTopic(data: Omit<Topic, "id" | "subTopics" | "videos" | "ownerId">) {
    if (!user) throw new Error("Not signed in");
    const colRef = collection(db, "data");
    const docRef = await addDoc(colRef, {
      ...data,
      ownerId: user.uid,
      createdAt: serverTimestamp(),
      subTopics: [],
      videos: [],
    });
    return docRef.id;
  }

  async function deleteTopic(id: string) {
    if (!user) throw new Error("Not signed in");
    // Add logic to check if user has permission to delete if needed
    await deleteDoc(doc(db, "data", id));
  }

  return (
    <TopicsContext.Provider
      value={{
        topics,
        topicsLoading,
        topicsError,
        addTopic,
        deleteTopic,
      }}
    >
      {children}
    </TopicsContext.Provider>
  );
};

export function useTopics() {
  const ctx = useContext(TopicsContext);
  if (!ctx) throw new Error("useTopics must be used within TopicsProvider");
  return ctx;
}
