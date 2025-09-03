
'use server';

import { collection, addDoc, getDocs, doc, Timestamp, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type SalesItem = {
  id: string;
  product: string;
  quantity: number;
  weightPerUnit?: number;
  price: number;
  total: number;
  date: Date;
  departmentId: string;
  ownerId: string;
};

export type SalesItemData = Omit<SalesItem, 'id' | 'ownerId'>;

function toSalesItem(doc: any): SalesItem {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        date: (data.date as Timestamp).toDate(),
    } as SalesItem;
}

export async function getSales(uid: string, departmentId: string): Promise<SalesItem[]> {
    if (!uid) throw new Error("User is not authenticated.");
    
    const salesCollectionRef = collection(db, 'sales');
    const q = query(salesCollectionRef, where("ownerId", "==", uid), where("departmentId", "==", departmentId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(toSalesItem);
}

export async function addSale(uid: string, data: SalesItemData): Promise<string> {
    if (!uid) throw new Error("User is not authenticated.");

    const salesCollectionRef = collection(db, 'sales');
    const docRef = await addDoc(salesCollectionRef, {
        ...data,
        date: Timestamp.fromDate(data.date),
        ownerId: uid,
    });
    return docRef.id;
}


export async function updateSale(saleId: string, data: Partial<SalesItemData>): Promise<void> {
    const saleRef = doc(db, 'sales', saleId);
    await updateDoc(saleRef, data);
}
