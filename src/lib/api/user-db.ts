// src/lib/api/user-db.ts
import { collection, doc, getDoc, getDocs, query, type DocumentData } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

/**
 * يجلب مستند مستخدم معين من مجموعة 'users'.
 * @param uid - معرف المستخدم (اختياري). إذا لم يتم توفيره، يستخدم المستخدم الحالي.
 * @returns بيانات المستخدم أو null إذا لم يوجد.
 */
export async function fetchUserDoc(uid?: string): Promise<Record<string, any> | null> {
  const userId = uid ?? auth.currentUser?.uid;
  if (!userId) {
    throw new Error("المستخدم غير مسجل الدخول أو لم يتم توفير UID.");
  }
  const userDocRef = doc(db, "users", userId);
  const userDocSnap = await getDoc(userDocRef);
  return userDocSnap.exists() ? userDocSnap.data() : null;
}

/**
 * يجلب جميع المستندات من مجموعة فرعية معينة لمستخدم.
 * @param collectionName - اسم المجموعة الفرعية (e.g., "workers", "tasks").
 * @param uid - معرف المستخدم (اختياري). إذا لم يتم توفيره، يستخدم المستخدم الحالي.
 * @returns مصفوفة من المستندات الموجودة في المجموعة الفرعية.
 */
export async function fetchUserSubcollection(collectionName: string, uid?: string): Promise<DocumentData[]> {
  const userId = uid ?? auth.currentUser?.uid;
  if (!userId) {
    throw new Error("المستخدم غير مسجل الدخول أو لم يتم توفير UID.");
  }
  const collectionRef = collection(db, "users", userId, collectionName);
  const q = query(collectionRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
