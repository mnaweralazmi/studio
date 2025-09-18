'use client';

import { useMemo } from 'react';
import {
  collection,
  query,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { auth, db } from '@/lib/firebase';

/**
 * خطاف مخصص لجلب البيانات من Firestore مع تحديثات لحظية.
 * @param collectionPath مسار المجموعة (Collection) في قاعدة البيانات.
 * @param constraints شروط الاستعلام مثل الترتيب (orderBy) أو التصفية (where).
 * @param isPublicQuery `true` إذا كانت المجموعة عامة (مثل publicTopics)، و `false` إذا كانت خاصة بالمستخدم.
 * @returns بيانات محدثة، وحالة التحميل، وأي أخطاء.
 */
export function useFirestoreQuery<T extends DocumentData>(
  collectionPath: string,
  constraints: QueryConstraint[] = [],
  isPublicQuery: boolean = false
) {
  const [user] = useAuthState(auth);

  // بناء الاستعلام بناءً على نوعه (عام أم خاص)
  const finalQuery = useMemo(() => {
    if (isPublicQuery) {
      // استعلام عام على المستوى الأعلى من قاعدة البيانات
      return query(collection(db, collectionPath), ...constraints);
    }
    
    // استعلام خاص بالمستخدم، يتطلب تسجيل الدخول
    if (user) {
      return query(
        collection(db, 'users', user.uid, collectionPath),
        ...constraints
      );
    }

    // إذا كان الاستعلام خاصًا والمستخدم غير مسجل، لا تقم بالاستعلام
    return null;
  }, [user, collectionPath, constraints, isPublicQuery]);

  const [snapshot, loading, error] = useCollection(finalQuery);

  // تصفية النتائج لإخفاء البيانات المؤرشفة
  const data = useMemo(() => {
    if (!snapshot) return [];

    return snapshot.docs
      .filter((doc) => doc.data().archived !== true)
      .map(
        (doc) =>
          ({
            id: doc.id,
            path: doc.ref.path,
            ...doc.data(),
          } as T & { id: string; path: string })
      );
  }, [snapshot]);

  // رسالة خطأ واضحة
  const errorMessage = error ? `فشل جلب البيانات: ${error.message}` : null;
  
  const refetch = () => {
     // react-firebase-hooks يقوم بالتحديث تلقائيًا
  };

  return { data, loading, error: errorMessage, refetch };
}
