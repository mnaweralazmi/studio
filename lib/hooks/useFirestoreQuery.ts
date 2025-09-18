'use client';

import { useMemo } from 'react';
import {
  collection,
  query,
  QueryConstraint,
  DocumentData,
  collectionGroup,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';

/**
 * A custom hook to fetch Firestore data with real-time updates.
 * @param collectionPath The path to the collection.
 * @param constraints Query constraints like orderBy or where.
 * @param isPublicQuery `true` if the collection is a top-level public collection (e.g., 'publicTopics').
 * @returns Real-time data, loading state, and any errors.
 */
export function useFirestoreQuery<T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  isPublicQuery: boolean = false
) {
  const [user] = useAuthState(auth);

  const finalQuery = useMemo(() => {
    let q;
    if (isPublicQuery) {
      // Build a query on a top-level collection.
      q = query(collection(db, collectionPath), ...constraints);
    } else {
      // For user-specific data, only proceed if the user is logged in.
      if (user) {
        q = query(
          collection(db, 'users', user.uid, collectionPath),
          ...constraints
        );
      } else {
        // If it's a private query and there's no user, don't query at all.
        return null;
      }
    }
    return q;
  }, [user, collectionPath, constraints, isPublicQuery]);

  const [snapshot, loading, error] = useCollection(finalQuery);

  // Memoize the data processing to prevent re-renders.
  const data = useMemo(() => {
    if (!snapshot) return [];

    // The `archived` field is filtered directly in the query where possible.
    // This mapping just transforms the data into a more usable format.
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          path: doc.ref.path,
          ...doc.data(),
        } as T & { id: string; path: string })
    );
  }, [snapshot]);

  const errorMessage = error ? `فشل جلب البيانات: ${error.message}` : null;

  // react-firebase-hooks handles refetching automatically on data change.
  const refetch = () => {};

  return { data, loading, error: errorMessage, refetch };
}
