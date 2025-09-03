
'use server';

import { collection, addDoc, getDocs, doc, Timestamp, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date; 
  isCompleted: boolean;
  isRecurring: boolean;
  reminderDays?: number;
  ownerId: string;
}

export type TaskData = Omit<Task, 'id' | 'ownerId'>;

function toTask(doc: any): Task {
    const data = doc.data();
    return {
        id: doc.id,
        title: data.title,
        description: data.description,
        dueDate: (data.dueDate as Timestamp).toDate(),
        isCompleted: data.isCompleted,
        isRecurring: data.isRecurring,
        reminderDays: data.reminderDays,
        ownerId: data.ownerId,
    };
}

export async function getTasks(uid: string): Promise<Task[]> {
    if (!uid) throw new Error("User is not authenticated.");
    
    const tasksCollectionRef = collection(db, 'tasks');
    const q = query(tasksCollectionRef, where("ownerId", "==", uid));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(toTask);
}

export async function addTask(uid: string, data: TaskData): Promise<string> {
    if (!uid) throw new Error("User is not authenticated.");

    const tasksCollectionRef = collection(db, 'tasks');
    const docRef = await addDoc(tasksCollectionRef, {
        ...data,
        dueDate: Timestamp.fromDate(data.dueDate),
        ownerId: uid,
    });
    return docRef.id;
}


export async function updateTask(taskId: string, data: Partial<TaskData>): Promise<void> {
    const taskRef = doc(db, 'tasks', taskId);
    const updateData: any = { ...data };

    if (data.dueDate) {
        updateData.dueDate = Timestamp.fromDate(data.dueDate);
    }
    
    await updateDoc(taskRef, updateData);
}
