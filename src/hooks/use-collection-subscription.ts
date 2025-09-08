
import { collection, onSnapshot, query, where, DocumentData, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

const mapTimestampsToDates = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  if (Array.isArray(data)) {
    return data.map(mapTimestampsToDates);
  }
  if (data && typeof data === "object" && Object.prototype.toString.call(data) !== "[object Date]") {
    const out: { [key: string]: any } = {};
    for (const k in data) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        out[k] = mapTimestampsToDates(data[k]);
      }
    }
    return out;
  }
  return data;
};

const useCollectionSubscription = <T extends DocumentData>(
  collectionName: string,
  userId?: string // userId is now optional
): [Array<T & { id: string }>, boolean] => {
  const [data, setData] = useState<Array<T & { id: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // This is the crucial check. If we are querying a user-specific collection
    // but the userId isn't available yet, we should wait.
    if (collectionName !== 'data' && !userId) {
        setLoading(false); // Not loading, just waiting for userId
        setData([]); // Ensure data is cleared
        return;
    }

    setLoading(true);
    
    // If userId is provided, create a query to filter by ownerId.
    // If userId is not provided, query the entire collection (for public data like topics).
    const colRef = collection(db, collectionName);
    const q = userId ? query(colRef, where("ownerId", "==", userId)) : query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => {
          const mappedData = mapTimestampsToDates(doc.data());
          return { id: doc.id, ...mappedData } as T & { id: string };
        });
        
        // Sort items locally after fetching
        items.sort((a, b) => {
            const dateA = a.date || a.dueDate || a.createdAt || a.completedAt || a.archivedAt;
            const dateB = b.date || b.dueDate || b.createdAt || b.completedAt || b.archivedAt;
            if (dateA && dateB) {
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            }
            return 0;
        });
        
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`[Firestore Error] Failed to listen to ${collectionName}:`, err);
        setData([]);
        setLoading(false);
      }
    );

    return () => {
        unsubscribe();
    };
  // Re-run the effect if the collectionName or userId changes.
  }, [collectionName, userId]);

  return [data, loading];
};

export default useCollectionSubscription;
