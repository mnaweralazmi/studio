
'use server';

import { collection, addDoc, getDocs, doc, Timestamp, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ExpenseItem = {
  id: string;
  date: Date;
  type: 'fixed' | 'variable';
  category: string;
  item: string;
  amount: number;
  departmentId: string;
  ownerId: string;
};

export type ExpenseItemData = Omit<ExpenseItem, 'id' | 'ownerId'>;


function toExpenseItem(doc: any): ExpenseItem {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        date: (data.date as Timestamp).toDate(),
    } as ExpenseItem;
}

export async function getExpenses(uid: string, departmentId: string): Promise<ExpenseItem[]> {
    if (!uid) throw new Error("User is not authenticated.");
    
    const expensesCollectionRef = collection(db, 'expenses');
    const q = query(expensesCollectionRef, where("ownerId", "==", uid), where("departmentId", "==", departmentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(toExpenseItem);
}

export async function addExpense(uid: string, data: ExpenseItemData): Promise<string> {
    if (!uid) throw new Error("User is not authenticated.");

    const expensesCollectionRef = collection(db, 'expenses');
    const docRef = await addDoc(expensesCollectionRef, {
        ...data,
        date: Timestamp.fromDate(data.date),
        ownerId: uid,
    });
    return docRef.id;
}


export async function updateExpense(expenseId: string, data: Partial<ExpenseItemData>): Promise<void> {
    const expenseRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseRef, data);
}
