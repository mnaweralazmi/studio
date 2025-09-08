
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
  userId?: string
): [Array<T & { id: string }>, boolean] => {
  const [data, setData] = useState<Array<T & { id: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(collection(db, collectionName), where("ownerId", "==", userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => {
          const mappedData = mapTimestampsToDates(doc.data());
          return { id: doc.id, ...mappedData } as T & { id: string };
        });
        
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
  }, [collectionName, userId]);

  return [data, loading];
};

export default useCollectionSubscription;
