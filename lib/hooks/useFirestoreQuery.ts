'use client';

import { useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  QueryConstraint,
  collectionGroup,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';

/**
 * A custom hook to query a Firestore collection or collection group with real-time updates,
 * automatically filtering for non-archived documents.
 * @param collectionPath The path to the Firestore collection.
 * @param constraints Optional array of Firestore query constraints (e.g., orderBy, limit).
 * @param isGroup A boolean to indicate if this is a collection group query.
 * @returns An object containing the data, loading state, error, and a refetch function.
 */
export function useFirestoreQuery<T>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  isGroup: boolean = false
) {
  const [user] = useAuthState(auth);

  const finalQuery = useMemo(() => {
    // For user-specific collections, we MUST wait for the user object to be available.
    if (!isGroup && !user) {
      return null;
    }

    const collectionRef = isGroup
      ? collectionGroup(db, collectionPath)
      // If it's not a group query, we know the user object is available here.
      : collection(db, 'users', user!.uid, collectionPath);
      
    // Always filter out archived documents
    const allConstraints = [where('archived', '!=', true), ...constraints];

    return query(collectionRef, ...allConstraints);
  }, [user, collectionPath, constraints, isGroup]);

  const [snapshot, loading, error] = useCollection(finalQuery);

  const data = useMemo(() => {
    if (!snapshot) return undefined;
    return snapshot.docs.map(doc => ({
      id: doc.id,
      path: doc.ref.path,
      ...doc.data(),
    })) as (T & { id: string, path: string })[];
  }, [snapshot]);

  const refetch = useCallback(() => {
    // This is a placeholder as react-firebase-hooks handles refetching automatically.
    // Changes to dependencies of `finalQuery` will trigger a refetch.
  }, []);

  const errorMessage = useMemo(() => {
    if (error?.code === 'failed-precondition') {
      return 'فشل جلب البيانات. قد يتطلب هذا الاستعلام فهرسًا مخصصًا في Firestore.';
    }
    return error ? error.message : null;
  }, [error]);

  return { data, loading, error: errorMessage, refetch };
}
