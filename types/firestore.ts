// types/firestore.ts
export type Topic = {
  id: string;
  path: string; // المسار الكامل للمستند
  title?: string;
  description?: string;
  imageUrl?: string;
  isPublic?: boolean;
  createdAt?: { seconds?: number; toMillis: () => number } | any; // Timestamp can be complex
  userId?: string;
  authorName?: string;
  [k: string]: any;
};
