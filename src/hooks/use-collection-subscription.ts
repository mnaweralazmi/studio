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

const useCollectionSubscription = <T extends DocumentData>(
  collectionName: string,
  userId?: string
): [Array<T & { id: string }>, boolean] => {
  const [data, setData] = useState<Array<T & { id: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // If there's no userId, we can't fetch data, so we stop loading and return an empty array.
    if (!userId) {
      setData([]);
      setLoading(false);
      return; // Exit the effect early
    }

    setLoading(true);
    
    // Create a query to get documents from the specified collection
    // where the `ownerId` field matches the current user's ID.
    const q = query(collection(db, collectionName), where("ownerId", "==", userId));

    // onSnapshot creates a real-time listener. It will fire once with the initial data,
    // and then again every time the data changes in Firestore.
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          // Convert Firestore Timestamps to JavaScript Date objects
          const mappedData = mapTimestampsToDates(doc.data());
          // Return the document data along with its ID
          return { id: doc.id, ...mappedData } as T & { id: string };
        });
        setData(items);
        setLoading(false); // Data has been loaded
      },
      (err) => {
        console.error(`[Firestore Error] Failed to listen to ${collectionName}:`, err);
        // In case of an error (e.g., permissions issue), clear data and stop loading.
        setData([]);
        setLoading(false);
      }
    );

    // This is a cleanup function. When the component unmounts,
    // it unsubscribes from the Firestore listener to prevent memory leaks.
    return () => {
        unsubscribe();
    };
  }, [collectionName, userId]); // Rerun the effect if the collectionName or userId changes

  return [data, loading];
};

export default useCollectionSubscription;
