'use client';

import { useMemo, useState } from 'react';
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
  Tractor,
  Egg,
  GitCommit,
  Briefcase,
  Scaling,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


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

const SectionBudgetDisplay = ({ data }) => {
    const netProfit = data.totalIncome - data.totalExpenses;
    
    return (
        <div className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                 <StatCard
                    title="الربح الصافي للقسم"
                    value={`${netProfit.toFixed(3)} د.ك`}
                    icon={Landmark}
                    color={netProfit >= 0 ? 'text-green-600' : 'text-destructive'}
                />
                <StatCard
                    title="إجمالي دخل القسم"
                    value={`${data.totalIncome.toFixed(3)} د.ك`}
                    icon={ArrowUpCircle}
                    color="text-green-600"
                />
                <StatCard
                    title="إجمالي مصروفات القسم"
                    value={`${data.totalExpenses.toFixed(3)} د.ك`}
                    icon={ArrowDownCircle}
                    color="text-destructive"
                />
                {Object.keys(data.extraStats || {}).map(key => {
                    const stat = data.extraStats[key];
                    return (
                        <StatCard
                            key={key}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color}
                        />
                    )
                })}
            </div>
             {data.summaryCard && (
                <Card>
                    <CardHeader className="pb-4">
                    <CardTitle>{data.summaryCard.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                    <div className={`text-3xl font-bold ${data.summaryCard.color || 'text-foreground'}`}>
                        {data.summaryCard.value}
                    </div>
                    {data.summaryCard.subtitle && <p className="text-xs text-muted-foreground mt-1">{data.summaryCard.subtitle}</p>}
                    </CardContent>
              </Card>
            )}
        </div>
    );
};


export default function BudgetView() {
  const [user, loadingUser] = useAuthState(auth);
  const [selectedSection, setSelectedSection] = useState('total');

  // --- Collection Refs ---
  const expensesCollection = user ? collection(db, 'users', user.uid, 'expenses') : null;
  const agriExpensesCollection = user ? collection(db, 'users', user.uid, 'agriExpenses') : null;
  const poultryExpensesCollection = user ? collection(db, 'users', user.uid, 'poultryExpenses') : null;
  const livestockExpensesCollection = user ? collection(db, 'users', user.uid, 'livestockExpenses') : null;
  
  const agriSalesCollection = user ? collection(db, 'users', user.uid, 'agriSales') : null;
  const poultryEggSalesCollection = user ? collection(db, 'users', user.uid, 'poultryEggSales') : null;
  const poultrySalesCollection = user ? collection(db, 'users', user.uid, 'poultrySales') : null;
  const livestockSalesCollection = user ? collection(db, 'users', user.uid, 'livestockSales') : null;

  const debtsCollection = user ? collection(db, 'users', user.uid, 'debts') : null;
  const workersCollection = user ? collection(db, 'users', user.uid, 'workers') : null;

  // --- Hooks ---
  const [expensesSnapshot, loadingExpenses] = useCollection(expensesCollection ? query(expensesCollection, where('archived', '!=', true)) : null);
  const [agriExpensesSnapshot, loadingAgriExpenses] = useCollection(agriExpensesCollection ? query(agriExpensesCollection, where('archived', '!=', true)) : null);
  const [poultryExpensesSnapshot, loadingPoultryExpenses] = useCollection(poultryExpensesCollection ? query(poultryExpensesCollection, where('archived', '!=', true)) : null);
  const [livestockExpensesSnapshot, loadingLivestockExpenses] = useCollection(livestockExpensesCollection ? query(livestockExpensesCollection, where('archived', '!=', true)) : null);

  const [agriSalesSnapshot, loadingAgriSales] = useCollection(agriSalesCollection ? query(agriSalesCollection, where('archived', '!=', true)) : null);
  const [poultryEggSalesSnapshot, loadingPoultryEggSales] = useCollection(poultryEggSalesCollection ? query(poultryEggSalesCollection, where('archived', '!=', true)) : null);
  const [poultrySalesSnapshot, loadingPoultrySales] = useCollection(poultrySalesCollection ? query(poultrySalesCollection, where('archived', '!=', true)) : null);
  const [livestockSalesSnapshot, loadingLivestockSales] = useCollection(livestockSalesCollection ? query(livestockSalesCollection, where('archived', '!=', true)) : null);

  const [debtsSnapshot, loadingDebts] = useCollection(debtsCollection ? query(debtsCollection, where('archived', '!=', true)) : null);
  const [workersSnapshot, loadingWorkers] = useCollection(workersCollection ? query(workersCollection, where('archived', '!=', true)) : null);

  const budgetData = useMemo(() => {
    const calculateTotal = (snapshot) => snapshot?.docs.reduce((sum, doc) => sum + (doc.data().amount || doc.data().totalAmount || 0), 0) || 0;
    const calculateSalaryTotal = (snapshot) => snapshot?.docs.reduce((sum, doc) => sum + (doc.data().salary || 0), 0) || 0;

    // --- All Sales ---
    const totalAgriSales = calculateTotal(agriSalesSnapshot);
    const totalPoultryEggSales = calculateTotal(poultryEggSalesSnapshot);
    const totalPoultrySales = calculateTotal(poultrySalesSnapshot);
    const totalLivestockSales = calculateTotal(livestockSalesSnapshot);
    const totalIncome = totalAgriSales + totalPoultryEggSales + totalPoultrySales + totalLivestockSales;

    // --- All Expenses ---
    const totalGeneralExpenses = calculateTotal(expensesSnapshot);
    const totalAgriExpenses = calculateTotal(agriExpensesSnapshot);
    const totalPoultryExpenses = calculateTotal(poultryExpensesSnapshot);
    const totalLivestockExpenses = calculateTotal(livestockExpensesSnapshot);
    const totalWorkerSalaries = calculateSalaryTotal(workersSnapshot);
    const totalOperationalExpenses = totalGeneralExpenses + totalAgriExpenses + totalPoultryExpenses + totalLivestockExpenses;
    const grandTotalExpenses = totalOperationalExpenses + totalWorkerSalaries;
    
    // --- Debts ---
    const debts = debtsSnapshot?.docs.map((doc) => doc.data() as Debt) || [];
    const totalDebtsForUs = debts.filter((d) => d.type === 'دين لنا').reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalDebtsOnUs = debts.filter((d) => d.type === 'دين علينا').reduce((sum, d) => sum + (d.amount || 0), 0);
    
    const netProfit = totalIncome - grandTotalExpenses;

    return {
      total: {
        totalIncome,
        totalExpenses: grandTotalExpenses,
        extraStats: {
            totalOperationalExpenses: { title: 'إجمالي المصروفات التشغيلية', value: `${totalOperationalExpenses.toFixed(3)} د.ك`, icon: ArrowDownCircle, color: 'text-destructive'},
            totalWorkerSalaries: { title: 'إجمالي رواتب العمال', value: `${totalWorkerSalaries.toFixed(3)} د.ك`, icon: Users, color: 'text-orange-500'},
            totalDebtsOnUs: { title: 'ديون علينا (واجبة السداد)', value: `${totalDebtsOnUs.toFixed(3)} د.ك`, icon: HandCoins, color: 'text-amber-600' },
            totalAssets: { title: 'إجمالي الأصول (تقريبي)', value: `${(netProfit + totalDebtsForUs - totalDebtsOnUs).toFixed(3)} د.ك`, icon: PiggyBank },
        },
        summaryCard: { title: 'ملخص المصروفات الكلي', value: `${grandTotalExpenses.toFixed(3)} د.ك`, subtitle: '(المصروفات التشغيلية + رواتب العمال)', color: 'text-destructive' }
      },
      agriculture: {
        totalIncome: totalAgriSales,
        totalExpenses: totalAgriExpenses,
      },
      poultry: {
        totalIncome: totalPoultryEggSales + totalPoultrySales,
        totalExpenses: totalPoultryExpenses,
      },
      livestock: {
        totalIncome: totalLivestockSales,
        totalExpenses: totalLivestockExpenses,
      },
      farmManagement: {
        totalIncome: 0,
        totalExpenses: totalGeneralExpenses + totalWorkerSalaries,
        extraStats: {
            totalDebtsOnUs: { title: 'ديون علينا (واجبة السداد)', value: `${totalDebtsOnUs.toFixed(3)} د.ك`, icon: HandCoins, color: 'text-amber-600' },
            totalDebtsForUs: { title: 'ديون لنا (مستحقة)', value: `${totalDebtsForUs.toFixed(3)} د.ك`, icon: HandCoins, color: 'text-green-600' },
        },
        summaryCard: { title: 'المصروفات الإدارية والعمالة', value: `${(totalGeneralExpenses + totalWorkerSalaries).toFixed(3)} د.ك`, color: 'text-destructive' }
      }
    };
  }, [
    agriSalesSnapshot, poultryEggSalesSnapshot, poultrySalesSnapshot, livestockSalesSnapshot,
    expensesSnapshot, agriExpensesSnapshot, poultryExpensesSnapshot, livestockExpensesSnapshot, 
    workersSnapshot, debtsSnapshot
  ]);

  const loading =
    loadingUser ||
    loadingExpenses || loadingAgriExpenses || loadingPoultryExpenses || loadingLivestockExpenses ||
    loadingAgriSales || loadingPoultryEggSales || loadingPoultrySales || loadingLivestockSales ||
    loadingDebts || loadingWorkers;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">الميزانية</h1>
        <p className="mt-1 text-muted-foreground">
          اختر قسمًا لعرض ملخصه المالي المفصل.
        </p>
      </header>
        
        <Tabs value={selectedSection} onValueChange={setSelectedSection} className="w-full">
            <TabsList className="h-auto w-full flex-col sm:flex-row sm:grid sm:grid-cols-5">
                <TabsTrigger value="total" className="flex items-center gap-2 w-full sm:w-auto justify-center"><Scaling className="h-4 w-4" />الإجمالية</TabsTrigger>
                <TabsTrigger value="farmManagement" className="flex items-center gap-2 w-full sm:w-auto justify-center"><Briefcase className="h-4 w-4" />الإدارة</TabsTrigger>
                <TabsTrigger value="agriculture" className="flex items-center gap-2 w-full sm:w-auto justify-center"><Tractor className="h-4 w-4" />الزراعة</TabsTrigger>
                <TabsTrigger value="poultry" className="flex items-center gap-2 w-full sm:w-auto justify-center"><Egg className="h-4 w-4" />الدواجن</TabsTrigger>
                <TabsTrigger value="livestock" className="flex items-center gap-2 w-full sm:w-auto justify-center"><GitCommit className="h-4 w-4 rotate-90" />المواشي</TabsTrigger>
            </TabsList>
        </Tabs>

        <div className="pt-4">
            <SectionBudgetDisplay data={budgetData[selectedSection]} />
        </div>

    </div>
  );
}
