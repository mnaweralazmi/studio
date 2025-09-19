'use client';

import { useMemo, useState } from 'react';
import { DocumentData } from 'firebase/firestore';
import {
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
  HandCoins,
  PiggyBank,
  Users,
  Tractor,
  Egg,
  Briefcase,
  Scaling,
  Landmark,
  GitCommit,
  Home,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestoreQuery } from '@/lib/hooks/useFirestoreQuery';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Debt = { amount: number; type: 'دين لنا' | 'دين علينا' };

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
    if (!data) return null;
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
  const [selectedSection, setSelectedSection] = useState('total');
  
  const { data: expenses, loading: loadingExpenses } = useFirestoreQuery('expenses', [], false);
  const { data: agriExpenses, loading: loadingAgriExpenses } = useFirestoreQuery('agriExpenses', [], false);
  const { data: poultryExpenses, loading: loadingPoultryExpenses } = useFirestoreQuery('poultryExpenses', [], false);
  const { data: livestockExpenses, loading: loadingLivestockExpenses } = useFirestoreQuery('livestockExpenses', [], false);
  const { data: agriSales, loading: loadingAgriSales } = useFirestoreQuery('agriSales', [], false);
  const { data: poultryEggSales, loading: loadingPoultryEggSales } = useFirestoreQuery('poultryEggSales', [], false);
  const { data: poultrySales, loading: loadingPoultrySales } = useFirestoreQuery('poultrySales', [], false);
  const { data: livestockSales, loading: loadingLivestockSales } = useFirestoreQuery('livestockSales', [], false);
  const { data: debts, loading: loadingDebts } = useFirestoreQuery('debts', [], false);
  const { data: workers, loading: loadingWorkers } = useFirestoreQuery('workers', [], false);

  const budgetData = useMemo(() => {
    const calculateTotal = (data: DocumentData[] | undefined, key: string) => data?.reduce((sum, doc) => sum + (doc[key] || 0), 0) || 0;

    // All Sales
    const totalAgriSales = calculateTotal(agriSales, 'totalAmount');
    const totalPoultryEggSales = calculateTotal(poultryEggSales, 'totalAmount');
    const totalPoultrySales = calculateTotal(poultrySales, 'totalAmount');
    const totalLivestockSales = calculateTotal(livestockSales, 'totalAmount');
    const totalIncome = totalAgriSales + totalPoultryEggSales + totalPoultrySales + totalLivestockSales;

    // All Expenses
    const totalGeneralExpenses = calculateTotal(expenses, 'amount');
    const totalAgriExpenses = calculateTotal(agriExpenses, 'amount');
    const totalPoultryExpenses = calculateTotal(poultryExpenses, 'amount');
    const totalLivestockExpenses = calculateTotal(livestockExpenses, 'amount');
    const totalWorkerSalaries = calculateTotal(workers, 'salary');
    const totalOperationalExpenses = totalGeneralExpenses + totalAgriExpenses + totalPoultryExpenses + totalLivestockExpenses;
    const grandTotalExpenses = totalOperationalExpenses + totalWorkerSalaries;
    
    // Debts
    const debtsData = (debts as Debt[]) || [];
    const totalDebtsForUs = debtsData.filter((d) => d.type === 'دين لنا').reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalDebtsOnUs = debtsData.filter((d) => d.type === 'دين علينا').reduce((sum, d) => sum + (d.amount || 0), 0);
    
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
    agriSales, poultryEggSales, poultrySales, livestockSales,
    expenses, agriExpenses, poultryExpenses, livestockExpenses, 
    workers, debts
  ]);

  const loading =
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
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الميزانية</h1>
          <p className="mt-1 text-muted-foreground">
            اختر قسمًا لعرض ملخصه المالي المفصل.
          </p>
        </div>
        <Link href="/home">
          <Button variant="outline">
            <Home className="h-4 w-4 ml-2" />
            العودة للرئيسية
          </Button>
        </Link>
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
