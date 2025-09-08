"use client";

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { type SalesItem } from '@/components/budget-content';
import { type ExpenseItem } from '@/components/expenses-content';
import { type DebtItem } from '@/components/debts-content';
import { type Worker } from '@/components/workers/types';
import useCollectionSubscription from '@/hooks/use-collection-subscription';

// 1. تعريف شكل البيانات التي سيوفرها هذا السياق
interface DataContextType {
  allSales: SalesItem[];
  allExpenses: ExpenseItem[];
  allDebts: DebtItem[];
  allWorkers: Worker[];
  loading: boolean;
}

// 2. إنشاء السياق مع قيم افتراضية أولية
const DataContext = createContext<DataContextType>({
  allSales: [],
  allExpenses: [],
  allDebts: [],
  allWorkers: [],
  loading: true,
});

// 3. إنشاء مكون "المزود" الذي سيغلف التطبيق
export const DataProvider = ({ children }: { children: ReactNode }) => {
  // الاعتماد على سياق المصادقة لمعرفة المستخدم الحالي وحالة التحميل
  const { user, loading: authLoading } = useAuth();

  // استخدام الخطاف المخصص لجلب البيانات لكل مجموعة بشكل مستقل
  // كل خطاف يعيد البيانات وحالة التحميل الخاصة به
  const [allSales, salesLoading] = useCollectionSubscription<SalesItem>('sales', user?.uid);
  const [allExpenses, expensesLoading] = useCollectionSubscription<ExpenseItem>('expenses', user?.uid);
  const [allDebts, debtsLoading] = useCollectionSubscription<DebtItem>('debts', user?.uid);
  const [allWorkers, workersLoading] = useCollectionSubscription<Worker>('workers', user?.uid);

  // تجميع كل حالات التحميل في متغير واحد.
  // ستكون القيمة النهائية `true` إذا كان أي من المصادر لا يزال قيد التحميل.
  const loading = authLoading || salesLoading || expensesLoading || debtsLoading || workersLoading;

  // استخدام `useMemo` لتحسين الأداء.
  // هذا يضمن أن كائن "value" لا يتم إعادة إنشائه إلا إذا تغيرت إحدى البيانات أو حالة التحميل.
  const value = useMemo(() => ({
    allSales,
    allExpenses,
    allDebts,
    allWorkers,
    loading
  }), [allSales, allExpenses, allDebts, allWorkers, loading]);

  // توفير البيانات المجمعة لجميع المكونات الفرعية
  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// 4. إنشاء خطاف مخصص لتسهيل استهلاك البيانات في المكونات الأخرى
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
