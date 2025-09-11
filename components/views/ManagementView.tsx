'use client';

import {
  DollarSign,
  ShoppingCart,
  HandCoins,
  User,
  Plus,
  Trash2,
  CreditCard,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, doc, deleteDoc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Helper to convert Firestore Timestamp to a readable string
const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString('ar-KW');
  }
  if(typeof date === 'string') {
     return new Date(date).toLocaleDateString('ar-KW');
  }
  return new Date(date).toLocaleDateString('ar-KW');
};


// Types
type Expense = {
  id: string;
  date: string | Timestamp;
  item: string;
  category: string;
  amount: number;
};

type Sale = {
  id: string;
  date: string | Timestamp;
  item: string;
  cartonCount: number;
  cartonWeight: string;
  cartonPrice: number;
  totalAmount: number;
};

type Debt = {
  id: string;
  party: string;
  dueDate: string | Timestamp;
  amount: number;
  type: 'دين لنا' | 'دين علينا';
};

type Worker = {
  id: string;
  name: string;
  salary: number;
};

const vegetableOptions = ['طماطم', 'خيار', 'بطاطس', 'باذنجان', 'فلفل', 'كوسا'];

// Generic Loading/Empty state component
function DataView<T>({ 
  loading, 
  data, 
  columns, 
  renderRow, 
  emptyMessage,
  onDelete
}: { 
  loading: boolean; 
  data: T[]; 
  columns: string[]; 
  renderRow: (item: T) => React.ReactNode;
  emptyMessage: string;
  onDelete?: (id: string) => Promise<void>;
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return <p className="text-muted-foreground text-center py-4">{emptyMessage}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, i) => <TableHead key={i} className={i === columns.length -1 ? 'text-left' : ''}>{col}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(renderRow)}
      </TableBody>
    </Table>
  );
}


// --- Sub-page Components ---

function ExpensesView({ user }) {
  const expensesCollection = user ? collection(db, 'users', user.uid, 'expenses') : null;
  const [snapshot, loading] = useCollection(expensesCollection ? query(expensesCollection, orderBy('date', 'desc')) : null);
  const expenses = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)) || [];

  const [newExpense, setNewExpense] = useState({
    item: '',
    category: '',
    amount: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddExpense = async () => {
    if (!newExpense.item || !newExpense.amount || !expensesCollection || isAdding) return;
    setIsAdding(true);
    
    try {
      await addDoc(expensesCollection, {
        date: new Date(),
        item: newExpense.item,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
      });
      setNewExpense({ item: '', category: '', amount: '' });
    } catch (e) { console.error(e); } 
    finally { setIsAdding(false); }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'expenses', id));
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-foreground sr-only">المصاريف</h1>
      <Card>
        <CardHeader>
          <CardTitle>إضافة مصروف جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item">البند</Label>
              <Input id="item" value={newExpense.item} onChange={(e) => setNewExpense({ ...newExpense, item: e.target.value })} placeholder="مثال: شراء بذور" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">الفئة</Label>
              <Input id="category" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} placeholder="مثال: مستلزمات زراعية" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ</Label>
              <Input id="amount" type="number" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="بالدينار الكويتي" dir="ltr" />
            </div>
          </div>
          <Button onClick={handleAddExpense} className="mt-4" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isAdding ? 'جاري الإضافة...' : 'إضافة المصروف'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة المصاريف</h2>
        <DataView<Expense>
          loading={loading}
          data={expenses}
          columns={['التاريخ', 'البند', 'الفئة', 'المبلغ', 'حذف']}
          emptyMessage="لا توجد مصاريف لعرضها."
          renderRow={(expense) => (
             <TableRow key={expense.id}>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell className="font-medium">{expense.item}</TableCell>
                <TableCell><Badge variant="secondary">{expense.category}</Badge></TableCell>
                <TableCell className="font-semibold text-destructive">{`${expense.amount.toFixed(3)} د.ك`}</TableCell>
                <TableCell className="text-left">
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
          )}
        />
      </div>
    </div>
  );
}

function SalesView({ user }) {
  const salesCollection = user ? collection(db, 'users', user.uid, 'sales') : null;
  const [snapshot, loading] = useCollection(salesCollection ? query(salesCollection, orderBy('date', 'desc')) : null);
  const sales = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)) || [];

  const [newSale, setNewSale] = useState({ item: '', cartonCount: '', cartonWeight: '', cartonPrice: '' });
  const [isAdding, setIsAdding] = useState(false);

   const handleAddSale = async () => {
    const { item, cartonCount, cartonWeight, cartonPrice } = newSale;
    if (!item || !cartonCount || !cartonWeight || !cartonPrice || !salesCollection || isAdding) return;
    
    setIsAdding(true);
    const totalAmount = parseFloat(cartonCount) * parseFloat(cartonPrice);

    try {
      await addDoc(salesCollection, {
        date: new Date(),
        item,
        cartonCount: parseFloat(cartonCount),
        cartonWeight,
        cartonPrice: parseFloat(cartonPrice),
        totalAmount,
      });
      setNewSale({ item: '', cartonCount: '', cartonWeight: '', cartonPrice: '' });
    } catch(e) { console.error(e); }
    finally { setIsAdding(false); }
  };

  const handleDeleteSale = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'sales', id));
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-foreground sr-only">المبيعات</h1>
      <Card>
        <CardHeader><CardTitle>إضافة بيع جديد</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item">المنتج</Label>
              <Select value={newSale.item} onValueChange={(value) => setNewSale({ ...newSale, item: value })}>
                <SelectTrigger id="item"><SelectValue placeholder="اختر نوع الخضار" /></SelectTrigger>
                <SelectContent>{vegetableOptions.map((veg) => (<SelectItem key={veg} value={veg}>{veg}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cartonCount">عدد الكراتين</Label>
              <Input id="cartonCount" type="number" placeholder="مثال: 50" value={newSale.cartonCount} onChange={(e) => setNewSale({ ...newSale, cartonCount: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cartonWeight">وزن الكرتون</Label>
              <Input id="cartonWeight" placeholder="مثال: 10 كيلو" value={newSale.cartonWeight} onChange={(e) => setNewSale({ ...newSale, cartonWeight: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cartonPrice">سعر الكرتون</Label>
              <Input id="cartonPrice" type="number" placeholder="بالدينار الكويتي" value={newSale.cartonPrice} onChange={(e) => setNewSale({ ...newSale, cartonPrice: e.target.value })} dir="ltr" />
            </div>
          </div>
          <Button onClick={handleAddSale} className="mt-4" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isAdding ? 'جاري الإضافة...' : 'إضافة البيع'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة المبيعات</h2>
        <DataView<Sale>
          loading={loading}
          data={sales}
          columns={['التاريخ', 'المنتج', 'عدد الكراتين', 'وزن الكرتون', 'سعر الكرتون', 'المبلغ الإجمالي', 'حذف']}
          emptyMessage="لا توجد مبيعات لعرضها."
          renderRow={(sale) => (
            <TableRow key={sale.id}>
              <TableCell>{formatDate(sale.date)}</TableCell>
              <TableCell className="font-medium">{sale.item}</TableCell>
              <TableCell>{sale.cartonCount}</TableCell>
              <TableCell>{sale.cartonWeight}</TableCell>
              <TableCell>{`${sale.cartonPrice.toFixed(3)} د.ك`}</TableCell>
              <TableCell className="font-semibold text-green-600">{`${sale.totalAmount.toFixed(3)} د.ك`}</TableCell>
              <TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => handleDeleteSale(sale.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
            </TableRow>
          )}
        />
      </div>
    </div>
  );
}

function DebtsView({ user }) {
  const debtsCollection = user ? collection(db, 'users', user.uid, 'debts') : null;
  const [snapshot, loading] = useCollection(debtsCollection ? query(debtsCollection, orderBy('dueDate', 'desc')) : null);
  const debts = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt)) || [];
  
  const [newDebt, setNewDebt] = useState({ party: '', amount: '', type: 'دين علينا' as 'دين لنا' | 'دين علينا' });
  const [isAdding, setIsAdding] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleAddDebt = async () => {
    const { party, amount, type } = newDebt;
    if (!party || !amount || !debtsCollection || isAdding) return;
    setIsAdding(true);
    
    try {
      await addDoc(debtsCollection, {
        party,
        dueDate: new Date(),
        amount: parseFloat(amount),
        type,
      });
      setNewDebt({ party: '', amount: '', type: 'دين علينا' });
    } catch(e) { console.error(e) }
    finally { setIsAdding(false) }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'debts', id));
  };

  const handleOpenPaymentDialog = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.amount.toString());
    setPaymentDialogOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedDebt || !paymentAmount || !user) return;
    const paymentValue = parseFloat(paymentAmount);
    if (isNaN(paymentValue) || paymentValue <= 0) return;

    const debtRef = doc(db, 'users', user.uid, 'debts', selectedDebt.id);
    const newAmount = selectedDebt.amount - paymentValue;

    try {
      if (newAmount > 0) {
        await updateDoc(debtRef, { amount: newAmount });
      } else {
        await deleteDoc(debtRef);
      }
    } catch(e) { console.error(e) }
    finally {
      setPaymentDialogOpen(false);
      setSelectedDebt(null);
      setPaymentAmount('');
    }
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-foreground sr-only">الديون</h1>
      <Card>
        <CardHeader><CardTitle>إضافة دين جديد</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label htmlFor="party">الجهة</Label><Input id="party" placeholder="مثال: مورد الأسمدة" value={newDebt.party} onChange={(e) => setNewDebt({ ...newDebt, party: e.target.value })}/></div>
            <div className="space-y-2"><Label htmlFor="amount">المبلغ</Label><Input id="amount" type="number" placeholder="بالدينار الكويتي" value={newDebt.amount} onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })} dir="ltr" /></div>
            <div className="space-y-2">
              <Label htmlFor="type">نوع الدين</Label>
              <Select value={newDebt.type} onValueChange={(value: 'دين لنا' | 'دين علينا') => setNewDebt({ ...newDebt, type: value })}>
                <SelectTrigger id="type"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                <SelectContent><SelectItem value="دين علينا">دين علينا</SelectItem><SelectItem value="دين لنا">دين لنا</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddDebt} className="mt-4" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isAdding ? 'جاري الإضافة...' : 'إضافة الدين'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة الديون</h2>
        <DataView<Debt>
            loading={loading}
            data={debts}
            columns={['الجهة', 'تاريخ الاستحقاق', 'نوع الدين', 'المبلغ', 'الإجراءات']}
            emptyMessage="لا توجد ديون لعرضها."
            renderRow={(debt) => (
              <TableRow key={debt.id}>
                  <TableCell className="font-medium">{debt.party}</TableCell>
                  <TableCell>{formatDate(debt.dueDate)}</TableCell>
                  <TableCell><Badge variant={debt.type === 'دين لنا' ? 'default' : 'destructive'}>{debt.type}</Badge></TableCell>
                  <TableCell className={`font-semibold ${debt.type === 'دين لنا' ? 'text-green-600' : 'text-destructive'}`}>{`${debt.amount.toFixed(3)} د.ك`}</TableCell>
                  <TableCell className="text-left flex items-center justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={() => handleOpenPaymentDialog(debt)} className="flex items-center gap-1"><CreditCard className="h-4 w-4" />سداد</Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDebt(debt.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
            )}
        />
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader><DialogTitle>سداد دين</DialogTitle></DialogHeader>
          {selectedDebt && (
            <div className="grid gap-4 py-4">
              <p>أنت على وشك سداد دين لـ<span className="font-bold"> {selectedDebt.party}</span>.</p>
              <p>المبلغ المتبقي:<span className="font-bold text-destructive"> {selectedDebt.amount.toFixed(3)} د.ك</span></p>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-amount" className="text-right">مبلغ السداد</Label>
                <Input id="payment-amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="col-span-3" dir="ltr" />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
            <Button onClick={handleProcessPayment}><CheckCircle className="h-4 w-4 ml-2" />تأكيد السداد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkersView({ user }) {
  const workersCollection = user ? collection(db, 'users', user.uid, 'workers') : null;
  const [snapshot, loading] = useCollection(workersCollection ? query(workersCollection, orderBy('name', 'asc')) : null);
  const workers = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker)) || [];

  const [newWorker, setNewWorker] = useState({ name: '', salary: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddWorker = async () => {
    const { name, salary } = newWorker;
    if (!name || !salary || !workersCollection || isAdding) return;
    setIsAdding(true);
    try {
      await addDoc(workersCollection, { name, salary: parseFloat(salary) });
      setNewWorker({ name: '', salary: '' });
    } catch (e) { console.error(e) }
    finally { setIsAdding(false); }
  };

  const handleDeleteWorker = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'workers', id));
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-foreground sr-only">العمال</h1>
      <Card>
        <CardHeader><CardTitle>إضافة عامل جديد</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="name">اسم العامل</Label><Input id="name" placeholder="مثال: أحمد عبدالله" value={newWorker.name} onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}/></div>
            <div className="space-y-2"><Label htmlFor="salary">راتب العامل</Label><Input id="salary" type="number" placeholder="بالدينار الكويتي" value={newWorker.salary} onChange={(e) => setNewWorker({ ...newWorker, salary: e.target.value })} dir="ltr" /></div>
          </div>
          <Button onClick={handleAddWorker} className="mt-4" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isAdding ? 'جاري الإضافة...' : 'إضافة العامل'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة العمال</h2>
        <DataView<Worker>
          loading={loading}
          data={workers}
          columns={['الاسم', 'راتب العامل', 'حذف']}
          emptyMessage="لا يوجد عمال لعرضهم."
          renderRow={(worker) => (
             <TableRow key={worker.id}>
                <TableCell className="font-medium flex items-center">
                  <div className="p-2 rounded-lg border bg-secondary/30 mr-3 rtl:mr-0 rtl:ml-3"><User className="h-6 w-6 text-primary" /></div>
                  {worker.name}
                </TableCell>
                <TableCell>{`${worker.salary.toFixed(3)} د.ك`}</TableCell>
                <TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => handleDeleteWorker(worker.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
              </TableRow>
          )}
        />
      </div>
    </div>
  );
}

export default function ManagementView() {
  const [activeTab, setActiveTab] = useState('expenses');
  const [user] = useAuthState(auth);

  const renderView = () => {
    if (!user) {
      return (
         <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    switch(activeTab) {
      case 'expenses': return <ExpensesView user={user} />;
      case 'sales': return <SalesView user={user}/>;
      case 'debts': return <DebtsView user={user} />;
      case 'workers': return <WorkersView user={user} />;
      default: return null;
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">إدارة المزرعة</h1>
        <p className="mt-1 text-muted-foreground">
          نظرة شاملة على عمليات مزرعتك.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="expenses"><DollarSign className="h-4 w-4 ml-2" />المصاريف</TabsTrigger>
          <TabsTrigger value="sales"><ShoppingCart className="h-4 w-4 ml-2" />المبيعات</TabsTrigger>
          <TabsTrigger value="debts"><HandCoins className="h-4 w-4 ml-2" />الديون</TabsTrigger>
          <TabsTrigger value="workers"><User className="h-4 w-4 ml-2" />العمال</TabsTrigger>
        </TabsList>
        <TabsContent value={activeTab} className="mt-6">
          {renderView()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
