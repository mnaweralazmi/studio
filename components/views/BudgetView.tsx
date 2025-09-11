'use client';

import { useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  HandCoins,
  Wallet,
  Landmark,
  PiggyBank,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Generic Types
type Expense = { amount: number };
type Sale = { totalAmount: number };
type Debt = { amount: number; type: 'دين لنا' | 'دين علينا' };
type Worker = { salary: number };

const StatCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  color?: string;
}) => (
  <Card className="shadow-md">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color || 'text-muted-foreground'}`} />
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${color || ''}`}>{value}</div>
    </CardContent>
  </Card>
);

export default function BudgetView() {
  const [user, loadingUser] = useAuthState(auth);

  // --- Collection Refs ---
  const expensesCollection = user ? collection(db, 'users', user.uid, 'expenses') : null;
  const poultryExpensesCollection = user ? collection(db, 'users', user.uid, 'poultryExpenses') : null;
  const livestockExpensesCollection = user ? collection(db, 'users', user.uid, 'livestockExpenses') : null;
  
  const agriSalesCollection = user ? collection(db, 'users', user.uid, 'agriSales') : null;
  const poultryEggSalesCollection = user ? collection(db, 'users', user.uid, 'poultryEggSales') : null;
  const poultrySalesCollection = user ? collection(db, 'users', user.uid, 'poultrySales') : null;
  const livestockSalesCollection = user ? collection(db, 'users', user.uid, 'livestockSales') : null;

  const debtsCollection = user ? collection(db, 'users', user.uid, 'debts') : null;
  const workersCollection = user ? collection(db, 'users', user.uid, 'workers') : null;

  // --- Hooks ---
  const [expensesSnapshot, loadingExpenses] = useCollection(expensesCollection ? query(expensesCollection) : null);
  const [poultryExpensesSnapshot, loadingPoultryExpenses] = useCollection(poultryExpensesCollection ? query(poultryExpensesCollection) : null);
  const [livestockExpensesSnapshot, loadingLivestockExpenses] = useCollection(livestockExpensesCollection ? query(livestockExpensesCollection) : null);

  const [agriSalesSnapshot, loadingAgriSales] = useCollection(agriSalesCollection ? query(agriSalesCollection) : null);
  const [poultryEggSalesSnapshot, loadingPoultryEggSales] = useCollection(poultryEggSalesCollection ? query(poultryEggSalesCollection) : null);
  const [poultrySalesSnapshot, loadingPoultrySales] = useCollection(poultrySalesCollection ? query(poultrySalesCollection) : null);
  const [livestockSalesSnapshot, loadingLivestockSales] = useCollection(livestockSalesCollection ? query(livestockSalesCollection) : null);

  const [debtsSnapshot, loadingDebts] = useCollection(debtsCollection ? query(debtsCollection) : null);
  const [workersSnapshot, loadingWorkers] = useCollection(workersCollection ? query(workersCollection) : null);

  const {
    totalIncome,
    totalExpenses,
    totalWorkerSalaries,
    totalDebtsForUs,
    totalDebtsOnUs,
    netProfit,
  } = useMemo(() => {
    // --- Sales ---
    const agriSales = agriSalesSnapshot?.docs.map((doc) => doc.data() as Sale) || [];
    const poultryEggSales = poultryEggSalesSnapshot?.docs.map((doc) => doc.data() as Sale) || [];
    const poultrySales = poultrySalesSnapshot?.docs.map((doc) => doc.data() as Sale) || [];
    const livestockSales = livestockSalesSnapshot?.docs.map((doc) => doc.data() as Sale) || [];

    const totalIncome = [
        ...agriSales, ...poultryEggSales, ...poultrySales, ...livestockSales
    ].reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);

    // --- Expenses ---
    const expenses = expensesSnapshot?.docs.map((doc) => doc.data() as Expense) || [];
    const poultryExpenses = poultryExpensesSnapshot?.docs.map((doc) => doc.data() as Expense) || [];
    const livestockExpenses = livestockExpensesSnapshot?.docs.map((doc) => doc.data() as Expense) || [];
    const workers = workersSnapshot?.docs.map((doc) => doc.data() as Worker) || [];

    const totalOperationalExpenses = [...expenses, ...poultryExpenses, ...livestockExpenses].reduce(
      (sum, expense) => sum + (expense.amount || 0), 0
    );
    const totalWorkerSalaries = workers.reduce(
      (sum, worker) => sum + (worker.salary || 0), 0
    );
    
    // --- Debts ---
    const debts = debtsSnapshot?.docs.map((doc) => doc.data() as Debt) || [];
    const totalDebtsForUs = debts.filter((d) => d.type === 'دين لنا').reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalDebtsOnUs = debts.filter((d) => d.type === 'دين علينا').reduce((sum, d) => sum + (d.amount || 0), 0);

    // --- Calculations ---
    const totalExpenses = totalOperationalExpenses + totalWorkerSalaries;
    const netProfit = totalIncome - totalExpenses;

    return {
      totalIncome,
      totalExpenses: totalOperationalExpenses,
      totalWorkerSalaries,
      totalDebtsForUs,
      totalDebtsOnUs,
      netProfit,
    };
  }, [
    agriSalesSnapshot, poultryEggSalesSnapshot, poultrySalesSnapshot, livestockSalesSnapshot,
    expensesSnapshot, poultryExpensesSnapshot, livestockExpensesSnapshot, 
    workersSnapshot, debtsSnapshot
  ]);

  const loading =
    loadingUser ||
    loadingExpenses || loadingPoultryExpenses || loadingLivestockExpenses ||
    loadingAgriSales || loadingPoultryEggSales || loadingPoultrySales || loadingLivestockSales ||
    loadingDebts || loadingWorkers;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const grandTotalExpenses = totalExpenses + totalWorkerSalaries;


  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">الميزانية</h1>
        <p className="mt-1 text-muted-foreground">
          ملخص شامل لوضعك المالي في المزرعة.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="الربح الصافي"
          value={`${netProfit.toFixed(3)} د.ك`}
          icon={Landmark}
          color={netProfit >= 0 ? 'text-green-600' : 'text-destructive'}
        />
        <StatCard
          title="إجمالي الدخل (المبيعات)"
          value={`${totalIncome.toFixed(3)} د.ك`}
          icon={ArrowUpCircle}
          color="text-green-600"
        />
        <StatCard
          title="إجمالي المصروفات (التشغيلية)"
          value={`${totalExpenses.toFixed(3)} د.ك`}
          icon={ArrowDownCircle}
          color="text-destructive"
        />
        <StatCard
          title="إجمالي رواتب العمال"
          value={`${totalWorkerSalaries.toFixed(3)} د.ك`}
          icon={Users}
          color="text-orange-500"
        />
        <StatCard
          title="ديون علينا (واجبة السداد)"
          value={`${totalDebtsOnUs.toFixed(3)} د.ك`}
          icon={HandCoins}
          color="text-amber-600"
        />
         <StatCard
          title="إجمالي الأصول (تقريبي)"
          value={`${(netProfit + totalDebtsForUs - totalDebtsOnUs).toFixed(3)} د.ك`}
          icon={PiggyBank}
        />
      </div>
       <Card>
        <CardHeader className="pb-4">
          <CardTitle>ملخص المصروفات الكلي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-destructive">
            {`${grandTotalExpenses.toFixed(3)} د.ك`}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            (المصروفات التشغيلية + رواتب العمال)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
