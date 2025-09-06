
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export async function fetchUserDoc(uid?: string) {
  const userId = uid ?? auth.currentUser?.uid;
  if (!userId) throw new Error("Not signed in");
  const snap = await getDoc(doc(db, "users", userId));
  return snap.exists() ? snap.data() : null;
}
