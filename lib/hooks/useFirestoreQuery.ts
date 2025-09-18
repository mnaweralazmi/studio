'use client';

import { useMemo } from 'react';
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
    
    let collectionRef;
    if (isGroup) {
      // For collection group queries, like 'publicTopics'
      collectionRef = collectionGroup(db, collectionPath);
    } else {
       // For user-specific sub-collections (e.g., 'users/{uid}/tasks')
      // At this point, we know 'user' is available.
      collectionRef = collection(db, 'users', user!.uid, collectionPath);
    }
      
    // Always filter out archived documents unless it's a collection group query
    // because group queries might need their own specific filters.
    const allConstraints = isGroup ? constraints : [where('archived', '!=', true), ...constraints];

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

  const errorMessage = useMemo(() => {
    if (error?.code === 'failed-precondition') {
      return 'فشل جلب البيانات. قد يتطلب هذا الاستعلام فهرسًا مخصصًا في Firestore.';
    }
     if (error?.code === 'permission-denied') {
      return 'فشل جلب البيانات: ليست لديك الصلاحية الكافية لعرض هذا المحتوى. قد تحتاج إلى التحقق من قواعد الأمان في Firestore.';
    }
    return error ? error.message : null;
  }, [error]);

  const refetch = () => {
     // `useCollection` from react-firebase-hooks re-fetches automatically
     // when the query object changes. This function is kept for API consistency
     // if manual refetching logic is needed in the future.
  };


  return { data, loading, error: errorMessage, refetch };
}
