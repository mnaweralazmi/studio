'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  QueryConstraint,
  collectionGroup,
  DocumentData,
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
    if (!user && !isGroup) return null; // Don't query user-specific collections if no user

    const collectionRef = isGroup
      ? collectionGroup(db, collectionPath)
      : collection(db, 'users', user!.uid, collectionPath);
      
    // Always filter out archived documents, unless the collection is publicTopics
    const allConstraints =
      collectionPath === 'publicTopics'
        ? [where('archived', '!=', true), ...constraints]
        : [where('archived', '!=', true), ...constraints];

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
    // The useCollection hook automatically refetches on changes.
    // This function is provided for manual refetching if ever needed,
    // though its direct implementation is tied to the hook's lifecycle.
    // In practice, changes to dependencies of useMemo for `finalQuery` would trigger a refetch.
    // For now, it's a placeholder. To implement a true manual refetch,
    // one might need to manage state differently, but react-firebase-hooks handles most cases.
  }, []);

  const errorMessage = useMemo(() => {
    if (error?.code === 'failed-precondition') {
      return 'فشل جلب البيانات. قد يتطلب هذا الاستعلام فهرسًا مخصصًا في Firestore.';
    }
    return error ? error.message : null;
  }, [error]);

  return { data, loading, error: errorMessage, refetch };
}
