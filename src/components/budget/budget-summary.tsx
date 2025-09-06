
"use client";

import * as React from 'react';
import { collection, onSnapshot, query, getDocs, DocumentData, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, AlertCircle } from 'lucide-react';
import type { SalesItem } from '../budget-content';
import type { ExpenseItem } from '../expenses-content';
import type { DebtItem } from '../debts-content';
import type { Worker } from '../workers/types';
import { db } from '@/lib/firebase';
import type { Department } from '@/app/financials/page';

const departments: Department[] = ['agriculture', 'livestock', 'poultry', 'fish'];

const useAllDepartmentsData = <T extends DocumentData>(
  collectionSuffix: string
): [T[], boolean] => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setData([]);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    
    // Create queries for each department's collection
    const departmentQueries = departments.map(dept => 
      query(collection(db, 'users', user.uid, `${dept}_${collectionSuffix}`))
    );

    const unsubscribes = departmentQueries.map((q, index) => 
      onSnapshot(q, (snapshot) => {
        const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        
        // Update the central data state
        setData(prevData => {
          // Filter out old data from this department to prevent duplicates
          const otherDeptsData = prevData.filter(item => (item as any).departmentId !== departments[index]);
          return [...otherDeptsData, ...fetchedData];
        });
      }, (error) => {
        console.error(`Error fetching ${departments[index]}_${collectionSuffix}:`, error);
      })
    );

    // This part is tricky because loading is distributed. 
    // We can simplify by just setting a timeout or a more complex loading state manager.
    // For now, let's assume loading is done after a short period.
    const timer = setTimeout(() => setLoading(false), 1500); // Simple loading simulation

    return () => {
      unsubscribes.forEach(unsub => unsub());
      clearTimeout(timer);
    };

  }, [user, authLoading, collectionSuffix]);

  // A more robust way to handle combined loading state from multiple snapshots
  React.useEffect(() => {
     if (!authLoading && user) {
       const runQueries = async () => {
         try {
           const allData: T[] = [];
           for (const dept of departments) {
             const q = query(collection(db, 'users', user.uid, `${dept}_${collectionSuffix}`));
             const snapshot = await getDocs(q);
             snapshot.forEach(doc => {
               allData.push({ id: doc.id, ...doc.data() } as T)
             });
           }
           setData(allData);
         } catch (error) {
           console.error("Failed to fetch all department data", error);
           setData([]);
         } finally {
            setLoading(false);
         }
       };
       runQueries();
     }
  }, [user, authLoading, collectionSuffix]);


  return [data, loading || authLoading];
};


export function BudgetSummary() {
    const { t } = useLanguage();
    
    const [allSales, salesLoading] = useAllDepartmentsData<SalesItem>('sales');
    const [allExpenses, expensesLoading] = useAllDepartmentsData<ExpenseItem>('expenses');
    const [allDebts, debtsLoading] = useAllDepartmentsData<DebtItem>('debts');
    const [allWorkers, workersLoading] = useAllDepartments_WorkersData();

    const loading = salesLoading || expensesLoading || debtsLoading || workersLoading;

    const totalSales = React.useMemo(() => allSales.reduce((sum, item) => sum + item.total, 0), [allSales]);
    
    const totalExpenses = React.useMemo(() => allExpenses.reduce((sum, item) => sum + item.amount, 0), [allExpenses]);

    const totalSalaries = React.useMemo(() => allWorkers.reduce((workerSum, worker) => {
        const salaries = (worker.transactions || []).filter(t => t.type === 'salary').reduce((sum, t) => sum + t.amount, 0);
        return workerSum + salaries;
    }, 0), [allWorkers]);
    
    const totalDebts = React.useMemo(() => allDebts.filter(d => d.status !== 'paid').reduce((sum, item) => {
        const paidAmount = (item.payments || []).reduce((pSum, p) => pSum + p.amount, 0);
        return sum + (item.amount - paidAmount);
    }, 0), [allDebts]);

    if (loading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        );
    }
    
    const totalExpenditure = totalExpenses + totalSalaries;
    const netProfit = totalSales - totalExpenditure;

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalIncome')}</CardTitle>
                    <ArrowUpCircle className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalSales.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('fromSales')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('totalExpenditure')}</CardTitle>
                    <ArrowDownCircle className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalExpenditure.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('expensesAndSalaries')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('netProfit')}</CardTitle>
                    <DollarSign className={`h-5 w-5 ${netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{netProfit.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('incomeVsExpenses')}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t('outstandingDebts')}</CardTitle>
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalDebts.toFixed(2)} {t('dinar')}</div>
                    <p className="text-xs text-muted-foreground">{t('totalUnpaidDebts')}</p>
                </CardContent>
            </Card>
        </div>
    )
}

// Special hook for workers since its name doesn't have department prefix
const useAllDepartments_WorkersData = (): [Worker[], boolean] => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<Worker[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setData([]);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'users', user.uid, `workers`));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedData = snapshot.docs.map(doc => {
          const docData = doc.data();
          return {
              id: doc.id,
              ...docData,
              transactions: (docData.transactions || []).map((t: any) => ({
                  ...t,
                  date: (t.date as Timestamp).toDate().toISOString()
              }))
          } as Worker;
      });
      setData(fetchedData);
      setLoading(false);
    }, (error) => {
      console.error(`Error fetching workers:`, error);
      setData([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  return [data, loading || authLoading];
};
