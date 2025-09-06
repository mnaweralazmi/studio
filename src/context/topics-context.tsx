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

type Topic = {
  id: string;
  title?: string;
  [k: string]: any;
};

type UserDoc = Record<string, any> | null;

type TopicsContextType = {
  topics: Topic[];
  topicsLoading: boolean;
  topicsError: string | null;

  userData: UserDoc;
  userLoading: boolean;
  userError: string | null;

  addTopic: (data: Omit<Topic, "id">) => Promise<string>;
  deleteTopic: (id: string) => Promise<void>;
};

const TopicsContext = createContext<TopicsContextType | undefined>(undefined);

export const TopicsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();

  // Topics state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState<boolean>(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  // User doc state
  const [userData, setUserData] = useState<UserDoc>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [userError, setUserError] = useState<string | null>(null);

  useEffect(() => {
    // until auth state resolved, show loading
    if (authLoading) {
      setTopicsLoading(true);
      setUserLoading(true);
      return;
    }

    // if not signed in -> clear everything and stop
    if (!user) {
      setTopics([]);
      setTopicsLoading(false);
      setTopicsError(null);

      setUserData(null);
      setUserLoading(false);
      setUserError(null);
      return;
    }

    // signed in: set up listeners for user doc and user's topics subcollection
    const unsubscribes: Unsubscribe[] = [];

    // 1) user doc listener (users/{uid})
    setUserLoading(true);
    setUserError(null);
    const userDocRef = doc(db, "users", user.uid);
    const unsubUser = onSnapshot(
      userDocRef,
      (snap) => {
        setUserData(snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as UserDoc) : null);
        setUserLoading(false);
      },
      (err) => {
        console.error("userDoc onSnapshot error:", err);
        setUserError(err?.message ?? "خطأ جلب بيانات المستخدم");
        setUserData(null);
        setUserLoading(false);
      }
    );
    unsubscribes.push(unsubUser);

    // 2) topics subcollection listener (users/{uid}/topics)
    setTopicsLoading(true);
    setTopicsError(null);
    const topicsColRef = collection(db, "users", user.uid, "topics");
    const unsubTopics = onSnapshot(
      topicsColRef,
      (snap) => {
        const items: Topic[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setTopics(items);
        setTopicsLoading(false);
      },
      (err) => {
        console.error("topics onSnapshot error:", err);
        setTopicsError(err?.message ?? "خطأ جلب المواضيع");
        setTopics([]);
        setTopicsLoading(false);
      }
    );
    unsubscribes.push(unsubTopics);

    // cleanup
    return () => {
      unsubscribes.forEach((u) => u());
    };
  }, [user, authLoading]);

  // addTopic & deleteTopic محافظتان على تحقق user
  async function addTopic(data: Omit<Topic, "id">) {
    if (!user) throw new Error("Not signed in");
    const colRef = collection(db, "users", user.uid, "topics");
    const docRef = await addDoc(colRef, { ...data, ownerId: user.uid, createdAt: serverTimestamp() });
    return docRef.id;
  }

  async function deleteTopic(id: string) {
    if (!user) throw new Error("Not signed in");
    await deleteDoc(doc(db, "users", user.uid, "topics", id));
  }

  return (
    <TopicsContext.Provider
      value={{
        topics,
        topicsLoading,
        topicsError,
        userData,
        userLoading,
        userError,
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
