
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { AgriculturalSection } from './types';

// Helper function to normalize Firestore Timestamps to Dates
function normalizeDocData<T = any>(docData: any): T {
    const out: any = {};
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

// Fetches topics for server-side rendering
export async function getTopics(): Promise<AgriculturalSection[]> {
    try {
        const topicsColRef = collection(db, 'data');
        const q = query(topicsColRef);
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            console.warn("No topics found in 'data' collection.");
            return [];
        }

        return snapshot.docs.map(d => ({ id: d.id, ...normalizeDocData(d.data()) })) as AgriculturalSection[];
    } catch (error) {
        console.error("Error fetching topics:", error);
        return []; // Return an empty array on error to prevent crashes
    }
}
