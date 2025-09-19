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
          const userDocRef = doc(db, 'users', user.uid);
          q = query(collection(userDocRef, collectionPath), ...constraints);
        } else {
          return null; // Don't query if it's a private query and no user is logged in
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

  const refetch = () => {};

  return { data, loading, error: errorMessage, refetch };
}
