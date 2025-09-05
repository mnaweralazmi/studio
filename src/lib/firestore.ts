/**
 * @fileoverview
 * This file centralizes Firestore collection paths to ensure consistency and
 * compliance with the security rules, which dictate that all user data

 * must be stored in subcollections under /users/{userId}.
 */
import { auth, db } from '@/lib/firebase';
import { collection, CollectionReference, DocumentData } from "firebase/firestore";

/**
 * Throws an error if no user is currently signed in.
 * To be called before any user-specific database operation.
 */
function ensureAuthenticated(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("User is not authenticated. Cannot perform Firestore operation.");
  }
  return uid;
}

/**
 * Returns a strongly-typed reference to a subcollection for the current user.
 * 
 * @param name The name of the subcollection (e.g., "data", "tasks", "sales").
 * @returns A Firestore CollectionReference pointing to the user's subcollection.
 */
export function userSubcollection<T = DocumentData>(name: string): CollectionReference<T> {
  const uid = ensureAuthenticated();
  return collection(db, "users", uid, name) as CollectionReference<T>;
}
