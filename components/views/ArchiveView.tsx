'use client';

import {
  collectionGroup,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, AlertCircle, RotateCcw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useState, useEffect, useCallback }from 'react';
import type { User } from 'firebase/auth';

const COLLECTION_CONFIG = {
  expenses: { name: 'المصاريف العامة', fields: ['item', 'category', 'amount'] },
  agriExpenses: { name: 'مصاريف الزراعة', fields: ['item', 'category', 'amount'] },
  poultryExpenses: { name: 'مصاريف الدواجن', fields: ['item', 'category', 'amount'] },
  livestockExpenses: { name: 'مصاريف المواشي', fields: ['item', 'category', 'amount'] },
  agriSales: { name: 'مبيعات الزراعة', fields: ['item', 'cartonCount', 'totalAmount'] },
  poultryEggSales: { name: 'مبيعات البيض', fields: ['trayCount', 'totalAmount'] },
  poultrySales: { name: 'مبيعات الدواجن', fields: ['poultryType', 'count', 'totalAmount'] },
  livestockSales: { name: 'مبيعات المواشي', fields: ['animalType', 'count', 'totalAmount'] },
  debts: { name: 'الديون', fields: ['party', 'type', 'amount'] },
  workers: { name: 'العمال', fields: ['name', 'salary'] },
  facilities: { name: 'المرافق', fields: ['name', 'type'] },
  poultryFlocks: { name: 'قطعان الدواجن', fields: ['name', 'birdCount'] },
  livestockHerds: { name: 'قطعان المواشي', fields: ['name', 'animalCount'] },
};


const formatDate = (date: any) => {
    if (!date) return 'غير متوفر';
    const d = date instanceof Timestamp ? date.toDate() : new Date(date);
    return d.toLocaleDateString('ar-KW', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatValue = (key: string, value: any) => {
    if (value === undefined || value === null) return 'N/A';
    if (['amount', 'totalAmount', 'cartonPrice', 'pricePerUnit', 'salary'].includes(key)) {
        return `${Number(value).toFixed(3)} د.ك`;
    }
    if (value instanceof Timestamp) {
        return formatDate(value);
    }
    return value.toString();
}

export default function ArchiveView({ user }: { user: User | null | undefined }) {
  const [archivedData, setArchivedData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ path: string; id: string } | null>(null);

  const fetchArchivedData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const allArchivedData: Record<string, any[]> = {};
      const collectionKeys = Object.keys(COLLECTION_CONFIG);
      const promises = collectionKeys.map(collectionId => {
        const q = query(
          collectionGroup(db, collectionId),
          where('archived', '==', true)
        );
        return getDocs(q);
      });

      const snapshots = await Promise.all(promises);

      snapshots.forEach((snapshot, index) => {
        const collectionId = collectionKeys[index];
        const userDocs = snapshot.docs.filter(d => d.ref.path.startsWith(`users/${user.uid}/`));
        
        if (userDocs.length > 0) {
          allArchivedData[collectionId] = userDocs.map(d => ({
            id: d.id,
            path: d.ref.path,
            ...d.data(),
          }));
        }
      });
      
      setArchivedData(allArchivedData);
    } catch (e: any) {
      console.error("Error fetching archived data:", e);
      setError('حدث خطأ أثناء جلب البيانات المؤرشفة. قد تحتاج بعض الاستعلامات إلى فهارس خاصة في Firestore.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
      if (user) {
        fetchArchivedData();
      }
  }, [user, fetchArchivedData]);

  const handleRestore = async (path: string) => {
    try {
      await updateDoc(doc(db, path), { archived: false });
      fetchArchivedData(); // Refresh data
    } catch (e) {
      console.error(e);
      // Show error to user
    }
  };

  const openDeleteDialog = (path: string, id: string) => {
    setSelectedItem({ path, id });
    setDialogOpen(true);
  };
  
  const handlePermanentDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteDoc(doc(db, selectedItem.path));
      fetchArchivedData(); // Refresh data
    } catch (e) {
      console.error(e);
    } finally {
      setDialogOpen(false);
      setSelectedItem(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-destructive">
        <AlertCircle className="h-12 w-12" />
        <p className="mt-4 text-center">{error}</p>
      </div>
    );
  }

  const hasData = Object.keys(archivedData).length > 0 && Object.values(archivedData).some(arr => arr.length > 0);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>الأرشيف</CardTitle>
          <p className="text-muted-foreground">
            عرض واستعادة وحذف البيانات التي تمت أرشفتها من التطبيق بشكل نهائي.
          </p>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-muted-foreground text-center py-8">
              الأرشيف فارغ حاليًا.
            </p>
          ) : (
            <Accordion type="multiple" className="w-full">
              {Object.entries(archivedData).map(([collectionId, items]) => {
                if(items.length === 0) return null;
                const config = COLLECTION_CONFIG[collectionId];
                if (!config) return null;
                return (
                  <AccordionItem value={collectionId} key={collectionId}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <span>{config.name}</span>
                        <Badge variant="secondary">{items.length}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {items.map((item) => (
                          <div key={item.id} className="p-4 border rounded-lg bg-muted/50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                {config.fields.map(field => (
                                    <div key={field}>
                                        <p className="font-semibold text-muted-foreground capitalize">{field}</p>
                                        <p>{formatValue(field, item[field])}</p>
                                    </div>
                                ))}
                                <div>
                                    <p className="font-semibold text-muted-foreground">تاريخ الأرشفة</p>
                                    <p>{formatDate(item.date)}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                                <Button size="sm" variant="outline" onClick={() => handleRestore(item.path)}>
                                    <RotateCcw className="h-4 w-4 ml-2" />
                                    استعادة
                                </Button>

                                <Button size="sm" variant="destructive" onClick={() => openDeleteDialog(item.path, item.id)}>
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف نهائي
                                </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تأكيد الحذف النهائي</DialogTitle>
                <DialogDescription>
                    هل أنت متأكد من رغبتك في حذف هذا العنصر بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">إلغاء</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handlePermanentDelete}>
                    تأكيد الحذف
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    