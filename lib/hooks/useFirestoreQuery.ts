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
 * A custom hook to query a Firestore collection or collection group with real-time updates.
 * It also filters out documents where 'archived' is true on the client side.
 * @param collectionPath The path to the Firestore collection or collection group ID.
 * @param constraints Optional array of Firestore query constraints (e.g., orderBy, limit).
 * @param isCollectionGroup A boolean to indicate if this is a collection group query.
 * @returns An object containing the data, loading state, error, and a refetch function.
 */
export function useFirestoreQuery<T>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  isCollectionGroup: boolean = false
) {
  const [user] = useAuthState(auth);

  const finalQuery = useMemo(() => {
    if (!isCollectionGroup && !user) {
      return null;
    }

    const baseCollection = isCollectionGroup
      ? collectionGroup(db, collectionPath)
      : collection(db, 'users', user!.uid, collectionPath);
    
    return query(baseCollection, ...constraints);
  }, [user, collectionPath, constraints, isCollectionGroup]);

  const [snapshot, loading, error] = useCollection(finalQuery);

  const data = useMemo(() => {
    if (!snapshot) return undefined;
    
    // Client-side filtering for archived documents
    const filteredDocs = snapshot.docs.filter(doc => doc.data().archived !== true);

    return filteredDocs.map(doc => ({
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
     // `useCollection` from react-firebase-hooks re-fetches automatically.
     // This function is kept for API consistency.
  };

  return { data, loading, error: errorMessage, refetch };
}
