
"use client";

import React, { createContext, useState, useContext, useEffect, useMemo, useRef, useCallback } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  CollectionReference,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
  doc,
  getDocs,
  writeBatch,
  limit,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

import type {
  Task,
  ArchivedTask,
  SalesItem,
  ArchivedSale,
  ExpenseItem,
  ArchivedExpense,
  DebtItem,
  ArchivedDebt,
  Worker,
  AgriculturalSection
} from "@/lib/types";

type UserProfile = {
  name?: string;
  role?: "admin" | "user";
  points?: number;
  level?: number;
  badges?: string[];
  photoURL?: string;
  [key: string]: any;
};

export interface User extends FirebaseUser, UserProfile {}

interface AppContextType {
  user: User | null;
  loading: boolean;
  tasks: Task[];
  completedTasks: ArchivedTask[];
  allSales: SalesItem[];
  archivedSales: ArchivedSale[];
  allExpenses: ExpenseItem[];
  archivedExpenses: ArchivedExpense[];
  allDebts: DebtItem[];
  archivedDebts: ArchivedDebt[];
  allWorkers: Worker[];
  topics: AgriculturalSection[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialAgriculturalSections: Omit<AgriculturalSection, 'id' | 'ownerId'>[] = [
    {
      titleKey: "topicIrrigation", descriptionKey: "topicIrrigationDesc", iconName: 'Droplets', image: 'https://picsum.photos/seed/topic1/400/200', hint: 'watering plants', subTopics: [
        { id: '1-1', titleKey: 'subTopicDripIrrigation', descriptionKey: 'subTopicDripIrrigationDesc', image: 'https://picsum.photos/seed/subtopic1/400/200', hint: 'drip irrigation' },
        { id: '1-2', titleKey: 'subTopicSprinklerIrrigation', descriptionKey: 'subTopicSprinklerIrrigationDesc', image: 'https://picsum.photos/seed/subtopic2/400/200', hint: 'sprinkler irrigation' },
      ], videos: [ { id: 'v-1', titleKey: 'videoGardeningBasics', durationKey: 'videoDuration45', image: 'https://picsum.photos/seed/video1/400/200', videoUrl: '#', hint: 'gardening basics' } ]
    },
    {
      titleKey: "topicFertilization", descriptionKey: "topicFertilizationDesc", iconName: 'FlaskConical', image: 'https://picsum.photos/seed/topic2/400/200', hint: 'fertilizer', subTopics: [
         { id: '5-1', titleKey: 'subTopicFertilizationTypes', descriptionKey: 'subTopicFertilizationTypesDesc', image: 'https://picsum.photos/seed/subtopic3/400/200', hint: 'fertilizer types' },
      ], videos: [ { id: 'v-2', titleKey: 'videoComposting', durationKey: 'videoDuration20', image: 'https://picsum.photos/seed/video2/400/200', videoUrl: '#', hint: 'compost bin' } ]
    },
    {
      titleKey: "topicPests", descriptionKey: "topicPestsDesc", iconName: 'Bug', image: 'https://picsum.photos/seed/topic3/400/200', hint: 'insect pest', subTopics: [
        { id: '2-1', titleKey: 'subTopicNaturalPestControl', descriptionKey: 'subTopicNaturalPestControlDesc', image: 'https://picsum.photos/seed/subtopic4/400/200', hint: 'ladybug pests' },
        { id: '2-2', titleKey: 'subTopicChemicalPesticides', descriptionKey: 'subTopicChemicalPesticidesDesc', image: 'https://picsum.photos/seed/subtopic5/400/200', hint: 'spraying pesticides' },
      ], videos: [ { id: 'v-5', titleKey: 'videoPestControl', durationKey: 'videoDuration18', image: 'https://picsum.photos/seed/video3/400/200', videoUrl: '#', hint: 'pest control' } ]
    },
    {
      titleKey: "topicPruning", descriptionKey: "topicPruningDesc", iconName: 'Scissors', image: 'https://picsum.photos/seed/topic4/400/200', hint: 'pruning shears', subTopics: [
        { id: '3-1', titleKey: 'subTopicFormativePruning', descriptionKey: 'subTopicFormativePruningDesc', image: 'https://picsum.photos/seed/subtopic6/400/200', hint: 'young tree' },
      ], videos: [ { id: 'v-3', titleKey: 'videoGrowingTomatoes', durationKey: 'videoDuration15', image: 'https://picsum.photos/seed/video4/400/200', videoUrl: '#', hint: 'tomato plant' } ]
    },
    {
      titleKey: "topicSoil", descriptionKey: "topicSoilDesc", iconName: 'Sprout', image: 'https://picsum.photos/seed/topic5/400/200', hint: 'rich soil', subTopics: [
         { id: '4-1', titleKey: 'subTopicSoilAnalysis', descriptionKey: 'subTopicSoilAnalysisDesc', image: 'https://picsum.photos/seed/subtopic7/400/200', hint: 'soil test' },
      ], videos: [ { id: 'v-4', titleKey: 'videoGardeningBasics', durationKey: 'videoDuration45', image: 'https://picsum.photos/seed/video5/400/200', videoUrl: '#', hint: 'gardening tools' } ]
    },
    { titleKey: "topicSeeds", descriptionKey: "topicSeedsDesc", iconName: 'Sprout', image: 'https://picsum.photos/seed/topic6/400/200', hint: 'seeds planting', subTopics: [], videos: [] },
    { titleKey: "topicHarvesting", descriptionKey: "topicHarvestingDesc", iconName: 'Leaf', image: 'https://picsum.photos/seed/topic7/400/200', hint: 'harvest basket', subTopics: [], videos: [] }
];

function normalizeDocData<T>(docData: DocumentData): T {
  const out: { [key: string]: any } = {};
  for (const k of Object.keys(docData)) {
    const v = docData[k];
    if (v && typeof v === "object" && typeof (v as any).toDate === "function") {
      out[k] = (v as any).toDate();
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function mapSnapshot<T>(snap: QuerySnapshot<DocumentData>): T[] {
  return snap.docs.map(d => ({ id: d.id, ...normalizeDocData(d.data()) })) as T[];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<ArchivedTask[]>([]);
  const [allSales, setAllSales] = useState<SalesItem[]>([]);
  const [archivedSales, setArchivedSales] = useState<ArchivedSale[]>([]);
  const [allExpenses, setAllExpenses] = useState<ExpenseItem[]>([]);
  const [archivedExpenses, setArchivedExpenses] = useState<ArchivedExpense[]>([]);
  const [allDebts, setAllDebts] = useState<DebtItem[]>([]);
  const [archivedDebts, setArchivedDebts] = useState<ArchivedDebt[]>([]);
  const [allWorkers, setAllWorkers] = useState<Worker[]>([]);
  const [topics, setTopics] = useState<AgriculturalSection[]>([]);
  
  const dataUnsubscribersRef = useRef<Unsubscribe[]>([]);

  const clearDataListeners = useCallback(() => {
    dataUnsubscribersRef.current.forEach(unsub => unsub());
    dataUnsubscribersRef.current = [];
  }, []);
  
  const resetAllData = useCallback(() => {
    setTasks([]);
    setCompletedTasks([]);
    setAllSales([]);
    setArchivedSales([]);
    setAllExpenses([]);
    setArchivedExpenses([]);
    setAllDebts([]);
    setArchivedDebts([]);
    setAllWorkers([]);
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
        clearDataListeners();
        resetAllData();
        
        if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const unsubUser = onSnapshot(userDocRef, (userDocSnap) => {
                const userProfile = userDocSnap.exists() ? (userDocSnap.data() as UserProfile) : {};
                const fullUser: User = { ...firebaseUser, ...userProfile };
                setUser(fullUser);
                setLoading(false);
            }, (error) => {
                console.error("Error listening to user document:", error);
                setUser(firebaseUser as User); 
                setLoading(false);
            });
            dataUnsubscribersRef.current.push(unsubUser);
        } else {
            setUser(null);
            setLoading(false);
        }
    });

    const initializePublicData = async () => {
        try {
            const dataColRef = collection(db, 'data');
            const q = query(dataColRef, limit(1));
            const dataSnap = await getDocs(q);

            if (dataSnap.empty) {
                console.log("Initializing public 'data' collection...");
                const batch = writeBatch(db);
                initialAgriculturalSections.forEach((topic) => {
                    const newTopicRef = doc(collection(db, 'data'));
                    batch.set(newTopicRef, topic);
                });
                await batch.commit();
            }
        } catch (error) {
             console.error("Failed to initialize public data:", error);
        }
    };
    initializePublicData();
    const unsubTopics = onSnapshot(query(collection(db, 'data')), (snapshot) => {
      setTopics(mapSnapshot<AgriculturalSection>(snapshot));
    }, error => console.error("Error listening to public 'data' collection:", error));
    dataUnsubscribersRef.current.push(unsubTopics);

    return () => {
      unsubAuth();
      clearDataListeners();
    };
  }, [clearDataListeners, resetAllData]);

  useEffect(() => {
    if (user) {
        const listenToCollection = <T,>(
            collectionName: string,
            setter: React.Dispatch<React.SetStateAction<T[]>>,
            uid: string
        ) => {
            const colRef = collection(db, collectionName) as CollectionReference<DocumentData>;
            const q = query(colRef, where("ownerId", "==", uid));
            const unsub = onSnapshot(q, (snapshot) => {
                setter(mapSnapshot<T>(snapshot));
            }, (error) => {
                console.error(`Error listening to ${collectionName}:`, error);
                setter([]);
            });
            dataUnsubscribersRef.current.push(unsub);
        };
        
        listenToCollection<Task>('tasks', setTasks, user.uid);
        listenToCollection<ArchivedTask>('completed_tasks', setCompletedTasks, user.uid);
        listenToCollection<SalesItem>('sales', setAllSales, user.uid);
        listenToCollection<ArchivedSale>('archive_sales', setArchivedSales, user.uid);
        listenToCollection<ExpenseItem>('expenses', setAllExpenses, user.uid);
        listenToCollection<ArchivedExpense>('archive_expenses', setArchivedExpenses, user.uid);
        listenToCollection<DebtItem>('debts', setAllDebts, user.uid);
        listenToCollection<ArchivedDebt>('archive_debts', setArchivedDebts, user.uid);
        listenToCollection<Worker>('workers', setAllWorkers, user.uid);
    } else {
      resetAllData();
    }

  }, [user, resetAllData]);


  const value = useMemo<AppContextType>(() => ({
    user,
    loading,
    tasks,
    completedTasks,
    allSales,
    archivedSales,
    allExpenses,
    archivedExpenses,
    allDebts,
    archivedDebts,
    allWorkers,
    topics,
  }), [
    user,
    loading,
    tasks,
    completedTasks,
    allSales,
    archivedSales,
    allExpenses,
    archivedExpenses,
    allDebts,
    archivedDebts,
    allWorkers,
    topics,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
};

    