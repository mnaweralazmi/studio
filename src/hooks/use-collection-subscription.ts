
import { collection, onSnapshot, query, DocumentData, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

const mapTimestampsToDates = (data: any): any => {
  if (data instanceof Timestamp) return data.toDate();
  if (Array.isArray(data)) return data.map(mapTimestampsToDates);
  if (data && typeof data === "object" && Object.prototype.toString.call(data) !== "[object Date]") {
    const out: any = {};
    for (const k in data) {
      if (Object.prototype.hasOwnProperty.call(data, k)) out[k] = mapTimestampsToDates(data[k]);
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

    const q = query(collection(db, "users", userId, collectionName));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const mapped = mapTimestampsToDates(doc.data());
          return { id: doc.id, ...mapped } as T & { id: string };
        });
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`[debug] onSnapshot error for ${collectionName}:`, err);
        // On error, clear data and stop loading to prevent infinite spinners
        setData([]);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe when the component unmounts or dependencies change
    return () => {
      try {
        unsubscribe();
      } catch (e) {
        console.warn(`[debug] unsubscribe error for ${collectionName}`, e);
      }
    };
  }, [collectionName, userId]);

  return [data, loading];
};

export default useCollectionSubscription;
