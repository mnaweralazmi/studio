'use client';

import { useMemo } from 'react';
import {
  collection,
  query,
  QueryConstraint,
  DocumentData,
  collectionGroup,
  doc,
  Query,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';

export type QueryType = 'userSubcollection' | 'publicCollection' | 'collectionGroup';


/**
 * A custom hook to fetch Firestore data with real-time updates.
 * @param firestoreQuery A full Firestore Query object, or a string for simple user subcollections.
 * @param constraints Query constraints (only used if firestoreQuery is a string).
 * @param queryType The type of query (only used if firestoreQuery is a string).
 * @returns Real-time data, loading state, and any errors.
 */
export function useFirestoreQuery<T extends DocumentData>(
  firestoreQuery: Query | string,
  constraints: QueryConstraint[] = [],
  queryType: QueryType = 'userSubcollection'
) {
  const [user] = useAuthState(auth);

  const finalQuery = useMemo(() => {
    // If a full query object is passed, use it directly.
    if (typeof firestoreQuery !== 'string') {
        return firestoreQuery;
    }

    // The following logic is for when a string path is passed.
    if (!user && (queryType === 'userSubcollection' || queryType === 'collectionGroup')) {
        return null;
    }

    let q;

    switch (queryType) {
      case 'publicCollection':
        q = query(collection(db, firestoreQuery), ...constraints);
        break;
      
      case 'collectionGroup':
        q = query(collectionGroup(db, firestoreQuery), ...constraints);
        break;

      case 'userSubcollection':
      default:
        if (user) {
          q = query(collection(db, 'users', user.uid, firestoreQuery), ...constraints);
        } else {
          return null; 
        }
        break;
    }

    return q;
  }, [user, firestoreQuery, constraints, queryType]);

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
