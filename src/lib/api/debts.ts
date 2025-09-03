
'use server';

import { collection, addDoc, getDocs, doc, Timestamp, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type Payment = {
  id: string;
  amount: number;
  date: Date;
};

export type DebtItem = {
  id: string;
  creditor: string;
  amount: number;
  dueDate?: Date;
  status: 'unpaid' | 'paid' | 'partially-paid';
  payments: Payment[];
  departmentId: string;
  ownerId: string;
};

export type DebtItemData = Omit<DebtItem, 'id' | 'ownerId' | 'payments'>;


async function toDebtItem(docSnap: any): Promise<DebtItem> {
    const data = docSnap.data();
    const paymentsCollectionRef = collection(db, 'debts', docSnap.id, 'payments');
    const paymentsSnapshot = await getDocs(paymentsCollectionRef);
    const payments: Payment[] = paymentsSnapshot.docs.map(pDoc => ({
      id: pDoc.id,
      amount: pDoc.data().amount,
      date: (pDoc.data().date as Timestamp).toDate(),
    }));

    return {
        id: docSnap.id,
        ...data,
        dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : undefined,
        payments: payments,
    } as DebtItem;
}

export async function getDebts(uid: string, departmentId: string): Promise<DebtItem[]> {
    if (!uid) throw new Error("User is not authenticated.");
    
    const debtsCollectionRef = collection(db, 'debts');
    const q = query(debtsCollectionRef, where("ownerId", "==", uid), where("departmentId", "==", departmentId));
    const querySnapshot = await getDocs(q);
    
    const debtPromises = querySnapshot.docs.map(toDebtItem);
    return Promise.all(debtPromises);
}

export async function addDebt(uid: string, data: DebtItemData): Promise<string> {
    if (!uid) throw new Error("User is not authenticated.");

    const debtsCollectionRef = collection(db, 'debts');
    const docRef = await addDoc(debtsCollectionRef, {
        ...data,
        dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null,
        ownerId: uid,
    });
    return docRef.id;
}


export async function updateDebt(debtId: string, data: Partial<DebtItemData>): Promise<void> {
    const debtRef = doc(db, 'debts', debtId);
    const updateData: any = { ...data };

    if (data.dueDate) {
        updateData.dueDate = Timestamp.fromDate(data.dueDate);
    }

    await updateDoc(debtRef, updateData);
}


export async function addDebtPayment(debtId: string, newStatus: DebtItem['status'], paymentData: Omit<Payment, 'id'>) {
    const batch = writeBatch(db);
        
    const newPaymentRef = doc(collection(db, 'debts', debtId, 'payments'));
    batch.set(newPaymentRef, {
        amount: paymentData.amount,
        date: Timestamp.fromDate(paymentData.date),
    });

    const debtDocRef = doc(db, 'debts', debtId);
    batch.update(debtDocRef, { status: newStatus });
    
    await batch.commit();
}
