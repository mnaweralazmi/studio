
import { collection, onSnapshot, query, getDocs, DocumentData, Timestamp } from "firebase/firestore";
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
    console.info(`[debug] useCollectionSubscription start`, { collectionName, userId });

    if (!userId) {
      console.warn(`[debug] No userId — clearing data for collection "${collectionName}"`);
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(collection(db, "users", userId, collectionName));

    // 1) Try onSnapshot first
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.info(`[debug] onSnapshot received for ${collectionName}: docs=${snapshot.size}`);
        const items = snapshot.docs.map((doc) => {
          const mapped = mapTimestampsToDates(doc.data());
          return { id: doc.id, ...mapped } as T & { id: string };
        });
        setData(items);
        setLoading(false);
      },
      async (err) => {
        console.error(`[debug] onSnapshot error for ${collectionName}:`, err);

        // 2) Fallback: try getDocs once to see if reads are allowed
        try {
          console.info(`[debug] Attempting fallback getDocs for ${collectionName}`);
          const snap = await getDocs(q);
          console.info(`[debug] getDocs succeeded: docs=${snap.size}`);
          const items = snap.docs.map(doc => ({ id: doc.id, ...mapTimestampsToDates(doc.data()) }) as T & { id: string });
          setData(items);
        } catch (getErr) {
          console.error(`[debug] getDocs also failed for ${collectionName}:`, getErr);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      try {
        unsubscribe();
        console.info(`[debug] unsubscribed from ${collectionName}`);
      } catch (e) {
        console.warn(`[debug] unsubscribe error for ${collectionName}`, e);
      }
    };
  }, [collectionName, userId]);

  return [data, loading];
};

export default useCollectionSubscription;
