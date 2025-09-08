
import { collection, onSnapshot, query, where, DocumentData, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

// This function recursively finds Timestamps and converts them to JS Date objects
const mapTimestampsToDates = (data: any): any => {
  if (data instanceof Timestamp) {
    return data.toDate();
  }
  // If it's an array, recursively call the function for each item
  if (Array.isArray(data)) {
    return data.map(mapTimestampsToDates);
  }
  // If it's a plain object (but not a Date object), recursively call the function for each value
  if (data && typeof data === "object" && Object.prototype.toString.call(data) !== "[object Date]") {
    const out: { [key: string]: any } = {};
    for (const k in data) {
      if (Object.prototype.hasOwnProperty.call(data, k)) {
        out[k] = mapTimestampsToDates(data[k]);
      }
    }
    return out;
  }
  // Return the data as-is if it's not a Timestamp, Array, or plain Object
  return data;
};

/**
 * A real-time Firestore collection subscription hook.
 *
 * This hook simplifies data fetching by performing a simple query to filter
 * documents by `ownerId` and then handles all sorting client-side. This approach
 * is more reliable and avoids the need for complex composite indexes in Firestore,
 * which can be a common source of "missing data" errors if not configured perfectly.
 *
 * @param collectionName The name of the Firestore collection to subscribe to.
 * @param userId The UID of the currently authenticated user.
 * @returns A tuple containing the array of documents and a loading state boolean.
 */
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
    
    // 1. Perform a simple query to get all documents for the current user.
    // This avoids the need for composite indexes for sorting.
    const q = query(collection(db, collectionName), where("ownerId", "==", userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => {
          // Firestore Timestamps need to be converted to JS Date objects
          const mappedData = mapTimestampsToDates(doc.data());
          return { id: doc.id, ...mappedData } as T & { id: string };
        });
        
        // 2. Sort the data on the client side. This is fast and reliable.
        items.sort((a, b) => {
            const dateA = a.date || a.dueDate || a.createdAt || a.completedAt || a.archivedAt;
            const dateB = b.date || b.dueDate || b.createdAt || b.completedAt || b.archivedAt;
            // Ensure both dates exist before comparing
            if (dateA && dateB) {
                // Sort in descending order (newest first)
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            }
            return 0; // No change in order if dates are missing
        });
        
        setData(items);
        setLoading(false);
      },
      (err) => {
        console.error(`[Firestore Error] Failed to listen to ${collectionName}:`, err);
        setData([]); // Clear data on error
        setLoading(false);
      }
    );

    // Cleanup the listener when the component unmounts or dependencies change
    return () => {
        unsubscribe();
    };
  }, [collectionName, userId]);

  return [data, loading];
};

export default useCollectionSubscription;
