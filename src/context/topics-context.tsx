
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
import type { AgriculturalSection } from "@/lib/types";

type Topic = AgriculturalSection;

type TopicsContextType = {
  topics: Topic[];
  topicsLoading: boolean;
  topicsError: string | null;
  addTopic: (data: Omit<Topic, "id" | "subTopics" | "videos">) => Promise<string>;
  deleteTopic: (id: string) => Promise<void>;
};

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState<boolean>(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch public topics regardless of auth state
    setTopicsLoading(true);
    setTopicsError(null);
    const topicsColRef = collection(db, "public_topics");

    const unsubscribe = onSnapshot(
      topicsColRef,
      (snap) => {
        const items: Topic[] = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Topic));
        setTopics(items);
        setTopicsLoading(false);
      },
      (err) => {
        console.error("public_topics onSnapshot error:", err);
        setTopicsError(err?.message ?? "خطأ في جلب المواضيع");
        setTopics([]);
        setTopicsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Functions for adding/deleting topics should still be protected
  async function addTopic(data: Omit<Topic, "id" | "subTopics" | "videos">) {
    if (!user) throw new Error("Not signed in");
    // Decide where to add topics, maybe a user-specific collection or a protected public one
    // For now, let's assume adding is a protected action to the public list.
    const colRef = collection(db, "public_topics");
    const docRef = await addDoc(colRef, {
      ...data,
      ownerId: user.uid, // still track owner for admin purposes
      createdAt: serverTimestamp(),
      subTopics: [],
      videos: [],
    });
    return docRef.id;
  }

  async function deleteTopic(id: string) {
    if (!user) throw new Error("Not signed in");
    // Add logic to check if user has permission to delete if needed
    await deleteDoc(doc(db, "public_topics", id));
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
