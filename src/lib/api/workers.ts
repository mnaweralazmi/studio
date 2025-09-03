
'use server';

import { collection, addDoc, getDocs, doc, Timestamp, updateDoc, query, where, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Worker, WorkerFormValues, Transaction, TransactionFormValues } from '@/components/workers/types';

async function toWorker(docSnap: any): Promise<Worker> {
    const data = docSnap.data();
    const transactionsColRef = collection(db, 'workers', docSnap.id, 'transactions');
    const transactionsSnapshot = await getDocs(transactionsColRef);
    const transactions: Transaction[] = transactionsSnapshot.docs.map(tDoc => ({ 
        id: tDoc.id, 
        ...tDoc.data(),
        date: (tDoc.data().date as Timestamp).toDate(),
    })) as Transaction[];

    return {
        id: docSnap.id,
        name: data.name,
        baseSalary: data.baseSalary,
        departmentId: data.departmentId,
        paidMonths: data.paidMonths || [],
        transactions: transactions,
    };
}


export async function getWorkers(uid: string, departmentId: string): Promise<Worker[]> {
     if (!uid) throw new Error("User is not authenticated.");
    
    const workersColRef = collection(db, 'workers');
    const q = query(workersColRef, where("ownerId", "==", uid), where("departmentId", "==", departmentId));
    const workersSnapshot = await getDocs(q);

    const workerPromises = workersSnapshot.docs.map(toWorker);
    return Promise.all(workerPromises);
}


export async function addWorker(uid: string, data: WorkerFormValues & { departmentId: string }): Promise<string> {
    if (!uid) throw new Error("User is not authenticated.");

    const workersColRef = collection(db, 'workers');
    const docRef = await addDoc(workersColRef, {
        ...data,
        ownerId: uid,
    });
    return docRef.id;
}

export async function updateWorker(workerId: string, data: Partial<WorkerFormValues>): Promise<void> {
    const workerRef = doc(db, 'workers', workerId);
    await updateDoc(workerRef, data);
}

export async function paySalary(workerId: string, paidMonth: { year: number, month: number }, transactionData: Omit<Transaction, 'id' | 'date'>) {
    const batch = writeBatch(db);

    const newTransactionRef = doc(collection(db, 'workers', workerId, 'transactions'));
    batch.set(newTransactionRef, {
        ...transactionData,
        date: Timestamp.fromDate(new Date()),
    });
    
    const workerRef = doc(db, 'workers', workerId);
    const workerDoc = await getDocs(query(collection(db, 'workers'), where('__name__', '==', workerId)));
    const workerData = workerDoc.docs[0].data();
    const updatedPaidMonths = [...(workerData.paidMonths || []), paidMonth];
    batch.update(workerRef, { paidMonths: updatedPaidMonths });

    await batch.commit();
}


export async function addTransaction(workerId: string, transactionData: Omit<Transaction, 'id' | 'date'>): Promise<string> {
    const newTransactionRef = await addDoc(collection(db, 'workers', workerId, 'transactions'), {
        ...transactionData,
        date: Timestamp.fromDate(new Date()),
    });
    return newTransactionRef.id;
}
