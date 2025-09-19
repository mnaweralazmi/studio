'use client';

import { useMemo } from 'react';
import {
  collection,
  query,
  QueryConstraint,
  DocumentData,
  collectionGroup,
  doc,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';

export type QueryType = 'userSubcollection' | 'publicCollection' | 'collectionGroup';


/**
 * A custom hook to fetch Firestore data with real-time updates.
 * @param collectionPath The path to the collection or the ID of the collection group.
 * @param constraints Query constraints like orderBy or where.
 * @param queryType Determines the type of query: 'userSubcollection', 'publicCollection', or 'collectionGroup'.
 * @returns Real-time data, loading state, and any errors.
 */
export function useFirestoreQuery<T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  queryType: QueryType = 'userSubcollection'
) {
  const [user] = useAuthState(auth);

  const finalQuery = useMemo(() => {
    if (!user && (queryType === 'userSubcollection' || queryType === 'collectionGroup')) {
        // Don't query user-specific or group data if no user is logged in
        return null;
    }

    let q;

    switch (queryType) {
      case 'publicCollection':
        q = query(collection(db, collectionPath), ...constraints);
        break;
      
      case 'collectionGroup':
        q = query(collectionGroup(db, collectionPath), ...constraints);
        break;

      case 'userSubcollection':
      default:
        if (user) {
          q = query(collection(db, 'users', user.uid, collectionPath), ...constraints);
        } else {
          return null; 
        }
        break;
    }

    return q;
  }, [user, collectionPath, constraints, queryType]);

  const [snapshot, loading, error] = useCollection(finalQuery);

  const data = useMemo(() => {
    if (!snapshot) return [];
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

  // The refetch function is not implemented as useCollection provides real-time updates.
  // This function is kept for API consistency if manual refetching is needed in the future.
  const refetch = () => {};

  return { data, loading, error: errorMessage, refetch };
}
