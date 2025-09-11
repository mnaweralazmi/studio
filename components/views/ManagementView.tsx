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
  Pencil,
  Egg,
  Drumstick,
  Users2,
  GitCommit,
  Tractor,
  Briefcase,
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


// Generic Types
type Expense = { id: string; date: string | Timestamp; item: string; category: string; amount: number; };
type Debt = { id: string; party: string; dueDate: string | Timestamp; amount: number; type: 'دين لنا' | 'دين علينا'; };
type Worker = { id: string; name: string; salary: number; };

// Agriculture Types
type AgriSale = { id: string; date: string | Timestamp; item: string; cartonCount: number; cartonWeight: string; cartonPrice: number; totalAmount: number; };
const vegetableOptions = ['طماطم', 'خيار', 'بطاطس', 'باذنجان', 'فلفل', 'كوسا'];

// Poultry Types
type EggSale = { id: string; date: string | Timestamp; trayCount: number; trayPrice: number; totalAmount: number; };
type PoultrySale = { id: string; date: string | Timestamp; poultryType: string; count: number; pricePerUnit: number; totalAmount: number; };
type Flock = { id: string; name: string; birdCount: number; };

// Livestock Types
type LivestockSale = { id: string; date: string | Timestamp; animalType: string; count: number; pricePerUnit: number; totalAmount: number; };
type Herd = { id: string; name: string; animalCount: number; };


// Generic Loading/Empty state component
function DataView<T extends { id: string }>({ 
  loading, 
  data, 
  columns, 
  renderRow, 
  emptyMessage
}: { 
  loading: boolean; 
  data: T[]; 
  columns: string[]; 
  renderRow: (item: T) => React.ReactNode;
  emptyMessage: string;
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


// --- Generic Sub-page Components ---

function ExpensesView({ user, collectionName, title }) {
  const collectionRef = user ? collection(db, 'users', user.uid, collectionName) : null;
  const [snapshot, loading] = useCollection(collectionRef ? query(collectionRef, orderBy('date', 'desc')) : null);
  const expenses = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)) || [];

  const [newExpense, setNewExpense] = useState({ item: '', category: '', amount: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddExpense = async () => {
    if (!newExpense.item || !newExpense.amount || !collectionRef || isAdding) return;
    setIsAdding(true);
    
    try {
      await addDoc(collectionRef, {
        date: new Date(),
        item: newExpense.item,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount) || 0,
      });
      setNewExpense({ item: '', category: '', amount: '' });
    } catch (e) { console.error(e); } 
    finally { setIsAdding(false); }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, collectionName, id));
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-foreground sr-only">{title}</h1>
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
              <Input id="category" value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} placeholder="مثال: مستلزمات" />
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
                <TableCell className="font-semibold text-destructive">{`${(expense.amount || 0).toFixed(3)} د.ك`}</TableCell>
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


// --- Agriculture Components ---
function AgriSalesView({ user }) {
  const salesCollection = user ? collection(db, 'users', user.uid, 'agriSales') : null;
  const [snapshot, loading] = useCollection(salesCollection ? query(salesCollection, orderBy('date', 'desc')) : null);
  const sales = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgriSale)) || [];

  const [newSale, setNewSale] = useState({ item: '', cartonCount: '', cartonWeight: '', cartonPrice: '' });
  const [isAdding, setIsAdding] = useState(false);

   const handleAddSale = async () => {
    const { item, cartonCount, cartonWeight, cartonPrice } = newSale;
    if (!item || !cartonCount || !cartonWeight || !cartonPrice || !salesCollection || isAdding) return;
    
    setIsAdding(true);
    const count = parseFloat(cartonCount) || 0;
    const price = parseFloat(cartonPrice) || 0;
    const totalAmount = count * price;

    try {
      await addDoc(salesCollection, {
        date: new Date(),
        item,
        cartonCount: count,
        cartonWeight,
        cartonPrice: price,
        totalAmount,
      });
      setNewSale({ item: '', cartonCount: '', cartonWeight: '', cartonPrice: '' });
    } catch(e) { console.error(e); }
    finally { setIsAdding(false); }
  };

  const handleDeleteSale = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'agriSales', id));
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-foreground sr-only">مبيعات الزراعة</h1>
      <Card>
        <CardHeader><CardTitle>إضافة بيع جديد (زراعي)</CardTitle></CardHeader>
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
        <h2 className="text-xl font-bold mb-4">قائمة المبيعات الزراعية</h2>
        <DataView<AgriSale>
          loading={loading}
          data={sales}
          columns={['التاريخ', 'المنتج', 'عدد الكراتين', 'وزن الكرتون', 'سعر الكرتون', 'المبلغ الإجمالي', 'حذف']}
          emptyMessage="لا توجد مبيعات لعرضها."
          renderRow={(sale) => (
            <TableRow key={sale.id}>
              <TableCell>{formatDate(sale.date)}</TableCell>
              <TableCell className="font-medium">{sale.item}</TableCell>
              <TableCell>{sale.cartonCount || 0}</TableCell>
              <TableCell>{sale.cartonWeight}</TableCell>
              <TableCell>{`${(sale.cartonPrice || 0).toFixed(3)} د.ك`}</TableCell>
              <TableCell className="font-semibold text-green-600">{`${(sale.totalAmount || 0).toFixed(3)} د.ك`}</TableCell>
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
        amount: parseFloat(amount) || 0,
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
    setPaymentAmount((debt.amount || 0).toString());
    setPaymentDialogOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedDebt || !paymentAmount || !user) return;
    const paymentValue = parseFloat(paymentAmount) || 0;
    if (paymentValue <= 0) return;

    const debtRef = doc(db, 'users', user.uid, 'debts', selectedDebt.id);
    const newAmount = (selectedDebt.amount || 0) - paymentValue;

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
                  <TableCell className={`font-semibold ${debt.type === 'دين لنا' ? 'text-green-600' : 'text-destructive'}`}>{`${(debt.amount || 0).toFixed(3)} د.ك`}</TableCell>
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
              <p>المبلغ المتبقي:<span className="font-bold text-destructive"> {(selectedDebt.amount || 0).toFixed(3)} د.ك</span></p>
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
  const expensesCollection = user ? collection(db, 'users', user.uid, 'expenses') : null;

  const [snapshot, loading] = useCollection(workersCollection ? query(workersCollection, orderBy('name', 'asc')) : null);
  const workers = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Worker)) || [];

  const [newWorker, setNewWorker] = useState({ name: '', salary: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [payingSalaryFor, setPayingSalaryFor] = useState<string | null>(null);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [newSalary, setNewSalary] = useState('');

  const handleAddWorker = async () => {
    const { name, salary } = newWorker;
    if (!name || !salary || !workersCollection || isAdding) return;
    setIsAdding(true);
    try {
      await addDoc(workersCollection, { name, salary: parseFloat(salary) || 0 });
      setNewWorker({ name: '', salary: '' });
    } catch (e) { console.error(e) }
    finally { setIsAdding(false); }
  };

  const handleDeleteWorker = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'workers', id));
  };
  
  const handleSalaryPayment = async (worker: Worker) => {
    if (!expensesCollection || !worker || !worker.id) return;
    setPayingSalaryFor(worker.id);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    try {
       await addDoc(expensesCollection, {
        date: new Date(),
        item: `راتب العامل: ${worker.name} (شهر ${currentMonth}/${currentYear})`,
        category: 'رواتب',
        amount: worker.salary || 0,
      });
    } catch(e) {
      console.error(e)
    } finally {
      setPayingSalaryFor(null);
    }
  };

  const handleOpenEditDialog = (worker: Worker) => {
    setEditingWorker(worker);
    setNewSalary((worker.salary || 0).toString());
    setIsEditDialogOpen(true);
  };

  const handleUpdateSalary = async () => {
    if (!editingWorker || !newSalary || !user) return;
    
    const workerRef = doc(db, 'users', user.uid, 'workers', editingWorker.id);
    const salaryValue = parseFloat(newSalary) || 0;

    try {
      await updateDoc(workerRef, { salary: salaryValue });
    } catch (e) {
      console.error(e);
    } finally {
      setIsEditDialogOpen(false);
      setEditingWorker(null);
      setNewSalary('');
    }
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
          columns={['الاسم', 'راتب العامل', 'الإجراءات']}
          emptyMessage="لا يوجد عمال لعرضهم."
          renderRow={(worker) => (
             <TableRow key={worker.id}>
                <TableCell className="font-medium flex items-center">
                  <div className="p-2 rounded-lg border bg-secondary/30 mr-3 rtl:mr-0 rtl:ml-3"><User className="h-6 w-6 text-primary" /></div>
                  {worker.name}
                </TableCell>
                <TableCell>{`${(worker.salary || 0).toFixed(3)} د.ك`}</TableCell>
                <TableCell className="text-left">
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSalaryPayment(worker)}
                      disabled={payingSalaryFor === worker.id}
                      className="flex items-center gap-1"
                    >
                      {payingSalaryFor === worker.id ? 
                        <Loader2 className="h-4 w-4 animate-spin" /> : 
                        <CreditCard className="h-4 w-4" />
                      }
                      دفع الراتب
                    </Button>
                     <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleOpenEditDialog(worker)}
                      disabled={payingSalaryFor === worker.id}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteWorker(worker.id)} disabled={payingSalaryFor === worker.id}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
          )}
        />
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تعديل راتب العامل</DialogTitle>
          </DialogHeader>
          {editingWorker && (
            <div className="grid gap-4 py-4">
              <p>
                أنت تعدل راتب العامل:
                <span className="font-bold"> {editingWorker.name}</span>
              </p>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-salary" className="text-right">
                  الراتب الجديد
                </Label>
                <Input
                  id="new-salary"
                  type="number"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  className="col-span-3"
                  dir="ltr"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">إلغاء</Button>
            </DialogClose>
            <Button onClick={handleUpdateSalary}>
              <CheckCircle className="h-4 w-4 ml-2" />
              حفظ التغييرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FarmManagementView({ user }) {
  const [activeTab, setActiveTab] = useState('expenses');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="expenses"><DollarSign className="h-4 w-4 ml-2" />المصاريف العامة</TabsTrigger>
        <TabsTrigger value="debts"><HandCoins className="h-4 w-4 ml-2" />الديون</TabsTrigger>
        <TabsTrigger value="workers"><User className="h-4 w-4 ml-2" />العمال</TabsTrigger>
      </TabsList>
      <TabsContent value="expenses" className="mt-6">
        <ExpensesView user={user} collectionName="expenses" title="المصاريف العامة" />
      </TabsContent>
      <TabsContent value="debts" className="mt-6">
        <DebtsView user={user} />
      </TabsContent>
       <TabsContent value="workers" className="mt-6">
        <WorkersView user={user} />
      </TabsContent>
    </Tabs>
  );
}

function AgricultureView({ user }) {
  const [activeTab, setActiveTab] = useState('expenses');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="expenses"><DollarSign className="h-4 w-4 ml-2" />المصاريف الزراعية</TabsTrigger>
        <TabsTrigger value="sales"><ShoppingCart className="h-4 w-4 ml-2" />المبيعات</TabsTrigger>
      </TabsList>
      <TabsContent value="expenses" className="mt-6">
        <ExpensesView user={user} collectionName="agriExpenses" title="المصاريف الزراعية" />
      </TabsContent>
      <TabsContent value="sales" className="mt-6">
        <AgriSalesView user={user} />
      </TabsContent>
    </Tabs>
  );
}

// --- Poultry Components ---

function EggSalesView({ user }) {
  const collectionRef = user ? collection(db, 'users', user.uid, 'poultryEggSales') : null;
  const [snapshot, loading] = useCollection(collectionRef ? query(collectionRef, orderBy('date', 'desc')) : null);
  const sales = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as EggSale)) || [];

  const [newSale, setNewSale] = useState({ trayCount: '', trayPrice: '' });
  const [isAdding, setIsAdding] = useState(false);

   const handleAddSale = async () => {
    const { trayCount, trayPrice } = newSale;
    if (!trayCount || !trayPrice || !collectionRef || isAdding) return;
    
    setIsAdding(true);
    const count = parseFloat(trayCount) || 0;
    const price = parseFloat(trayPrice) || 0;
    const totalAmount = count * price;

    try {
      await addDoc(collectionRef, {
        date: new Date(),
        trayCount: count,
        trayPrice: price,
        totalAmount,
      });
      setNewSale({ trayCount: '', trayPrice: '' });
    } catch(e) { console.error(e); }
    finally { setIsAdding(false); }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'poultryEggSales', id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>إضافة بيع بيض جديد</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trayCount">عدد الأطباق</Label>
              <Input id="trayCount" type="number" placeholder="مثال: 100" value={newSale.trayCount} onChange={(e) => setNewSale({ ...newSale, trayCount: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trayPrice">سعر الطبق</Label>
              <Input id="trayPrice" type="number" placeholder="بالدينار الكويتي" value={newSale.trayPrice} onChange={(e) => setNewSale({ ...newSale, trayPrice: e.target.value })} dir="ltr" />
            </div>
          </div>
          <Button onClick={handleAddSale} className="mt-4" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isAdding ? 'جاري الإضافة...' : 'إضافة البيع'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة مبيعات البيض</h2>
        <DataView<EggSale>
          loading={loading}
          data={sales}
          columns={['التاريخ', 'عدد الأطباق', 'سعر الطبق', 'المبلغ الإجمالي', 'حذف']}
          emptyMessage="لا توجد مبيعات بيض لعرضها."
          renderRow={(sale) => (
            <TableRow key={sale.id}>
              <TableCell>{formatDate(sale.date)}</TableCell>
              <TableCell>{sale.trayCount || 0}</TableCell>
              <TableCell>{`${(sale.trayPrice || 0).toFixed(3)} د.ك`}</TableCell>
              <TableCell className="font-semibold text-green-600">{`${(sale.totalAmount || 0).toFixed(3)} د.ك`}</TableCell>
              <TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => handleDelete(sale.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
            </TableRow>
          )}
        />
      </div>
    </div>
  );
}

function PoultrySalesView({ user }) {
  const collectionRef = user ? collection(db, 'users', user.uid, 'poultrySales') : null;
  const [snapshot, loading] = useCollection(collectionRef ? query(collectionRef, orderBy('date', 'desc')) : null);
  const sales = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as PoultrySale)) || [];

  const [newSale, setNewSale] = useState({ poultryType: 'دجاج حي', count: '', pricePerUnit: '' });
  const [isAdding, setIsAdding] = useState(false);

   const handleAddSale = async () => {
    const { poultryType, count, pricePerUnit } = newSale;
    if (!poultryType || !count || !pricePerUnit || !collectionRef || isAdding) return;
    
    setIsAdding(true);
    const numCount = parseFloat(count) || 0;
    const price = parseFloat(pricePerUnit) || 0;
    const totalAmount = numCount * price;

    try {
      await addDoc(collectionRef, {
        date: new Date(),
        poultryType,
        count: numCount,
        pricePerUnit: price,
        totalAmount,
      });
      setNewSale({ poultryType: 'دجاج حي', count: '', pricePerUnit: '' });
    } catch(e) { console.error(e); }
    finally { setIsAdding(false); }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'poultrySales', id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>إضافة بيع دواجن جديد</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
              <Label htmlFor="poultryType">النوع</Label>
               <Input id="poultryType" placeholder="مثال: دجاج حي" value={newSale.poultryType} onChange={(e) => setNewSale({ ...newSale, poultryType: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">العدد</Label>
              <Input id="count" type="number" placeholder="مثال: 20" value={newSale.count} onChange={(e) => setNewSale({ ...newSale, count: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">سعر الوحدة</Label>
              <Input id="pricePerUnit" type="number" placeholder="بالدينار الكويتي" value={newSale.pricePerUnit} onChange={(e) => setNewSale({ ...newSale, pricePerUnit: e.target.value })} dir="ltr" />
            </div>
          </div>
          <Button onClick={handleAddSale} className="mt-4" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isAdding ? 'جاري الإضافة...' : 'إضافة البيع'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة مبيعات الدواجن</h2>
        <DataView<PoultrySale>
          loading={loading}
          data={sales}
          columns={['التاريخ', 'النوع', 'العدد', 'سعر الوحدة', 'المبلغ الإجمالي', 'حذف']}
          emptyMessage="لا توجد مبيعات دواجن لعرضها."
          renderRow={(sale) => (
            <TableRow key={sale.id}>
              <TableCell>{formatDate(sale.date)}</TableCell>
               <TableCell>{sale.poultryType}</TableCell>
              <TableCell>{sale.count || 0}</TableCell>
              <TableCell>{`${(sale.pricePerUnit || 0).toFixed(3)} د.ك`}</TableCell>
              <TableCell className="font-semibold text-green-600">{`${(sale.totalAmount || 0).toFixed(3)} د.ك`}</TableCell>
              <TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => handleDelete(sale.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
            </TableRow>
          )}
        />
      </div>
    </div>
  );
}

function FlocksView({ user }) {
  const collectionRef = user ? collection(db, 'users', user.uid, 'poultryFlocks') : null;
  const [snapshot, loading] = useCollection(collectionRef ? query(collectionRef, orderBy('name', 'asc')) : null);
  const flocks = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flock)) || [];

  const [newFlock, setNewFlock] = useState({ name: '', birdCount: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    const { name, birdCount } = newFlock;
    if (!name || !birdCount || !collectionRef || isAdding) return;
    setIsAdding(true);
    try {
      await addDoc(collectionRef, { name, birdCount: parseInt(birdCount) || 0 });
      setNewFlock({ name: '', birdCount: '' });
    } catch (e) { console.error(e) }
    finally { setIsAdding(false); }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'poultryFlocks', id));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>إضافة قطيع دواجن جديد</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="flock-name">اسم/نوع القطيع</Label><Input id="flock-name" placeholder="مثال: قطيع بياض #1" value={newFlock.name} onChange={(e) => setNewFlock({ ...newFlock, name: e.target.value })}/></div>
            <div className="space-y-2"><Label htmlFor="flock-count">عدد الطيور</Label><Input id="flock-count" type="number" placeholder="مثال: 500" value={newFlock.birdCount} onChange={(e) => setNewFlock({ ...newFlock, birdCount: e.target.value })} dir="ltr" /></div>
          </div>
          <Button onClick={handleAdd} className="mt-4" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isAdding ? 'جاري الإضافة...' : 'إضافة القطيع'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة قطعان الدواجن</h2>
        <DataView<Flock>
          loading={loading}
          data={flocks}
          columns={['الاسم/النوع', 'عدد الطيور', 'حذف']}
          emptyMessage="لا يوجد قطعان لعرضها."
          renderRow={(flock) => (
             <TableRow key={flock.id}>
                <TableCell className="font-medium">{flock.name}</TableCell>
                <TableCell>{flock.birdCount || 0}</TableCell>
                <TableCell className="text-left">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(flock.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
          )}
        />
      </div>
    </div>
  );
}


function PoultryView({ user }) {
  const [activeTab, setActiveTab] = useState('expenses');
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="expenses"><DollarSign className="h-4 w-4 ml-2" />المصاريف</TabsTrigger>
        <TabsTrigger value="eggSales"><Egg className="h-4 w-4 ml-2" />مبيعات البيض</TabsTrigger>
        <TabsTrigger value="poultrySales"><Drumstick className="h-4 w-4 ml-2" />مبيعات الدواجن</TabsTrigger>
        <TabsTrigger value="flocks"><Users2 className="h-4 w-4 ml-2" />القطعان</TabsTrigger>
      </TabsList>
       <TabsContent value="expenses" className="mt-6">
          <ExpensesView user={user} collectionName="poultryExpenses" title="مصاريف الدواجن"/>
       </TabsContent>
        <TabsContent value="eggSales" className="mt-6">
          <EggSalesView user={user} />
        </TabsContent>
         <TabsContent value="poultrySales" className="mt-6">
          <PoultrySalesView user={user} />
        </TabsContent>
         <TabsContent value="flocks" className="mt-6">
          <FlocksView user={user} />
        </TabsContent>
    </Tabs>
  );
}

// --- Livestock Components ---

function LivestockSalesView({ user }) {
  const collectionRef = user ? collection(db, 'users', user.uid, 'livestockSales') : null;
  const [snapshot, loading] = useCollection(collectionRef ? query(collectionRef, orderBy('date', 'desc')) : null);
  const sales = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as LivestockSale)) || [];

  const [newSale, setNewSale] = useState({ animalType: 'خروف', count: '', pricePerUnit: '' });
  const [isAdding, setIsAdding] = useState(false);

   const handleAddSale = async () => {
    const { animalType, count, pricePerUnit } = newSale;
    if (!animalType || !count || !pricePerUnit || !collectionRef || isAdding) return;
    
    setIsAdding(true);
    const numCount = parseFloat(count) || 0;
    const price = parseFloat(pricePerUnit) || 0;
    const totalAmount = numCount * price;

    try {
      await addDoc(collectionRef, {
        date: new Date(),
        animalType,
        count: numCount,
        pricePerUnit: price,
        totalAmount,
      });
      setNewSale({ animalType: 'خروف', count: '', pricePerUnit: '' });
    } catch(e) { console.error(e); }
    finally { setIsAdding(false); }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'livestockSales', id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>إضافة بيع مواشي جديد</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="space-y-2">
              <Label htmlFor="animalType">نوع الحيوان</Label>
               <Input id="animalType" placeholder="مثال: خروف نعيمي" value={newSale.animalType} onChange={(e) => setNewSale({ ...newSale, animalType: e.target.value })}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">العدد</Label>
              <Input id="count" type="number" placeholder="مثال: 5" value={newSale.count} onChange={(e) => setNewSale({ ...newSale, count: e.target.value })} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">سعر الرأس</Label>
              <Input id="pricePerUnit" type="number" placeholder="بالدينار الكويتي" value={newSale.pricePerUnit} onChange={(e) => setNewSale({ ...newSale, pricePerUnit: e.target.value })} dir="ltr" />
            </div>
          </div>
          <Button onClick={handleAddSale} className="mt-4" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isAdding ? 'جاري الإضافة...' : 'إضافة البيع'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة مبيعات المواشي</h2>
        <DataView<LivestockSale>
          loading={loading}
          data={sales}
          columns={['التاريخ', 'النوع', 'العدد', 'سعر الرأس', 'المبلغ الإجمالي', 'حذف']}
          emptyMessage="لا توجد مبيعات مواشي لعرضها."
          renderRow={(sale) => (
            <TableRow key={sale.id}>
              <TableCell>{formatDate(sale.date)}</TableCell>
               <TableCell>{sale.animalType}</TableCell>
              <TableCell>{sale.count || 0}</TableCell>
              <TableCell>{`${(sale.pricePerUnit || 0).toFixed(3)} د.ك`}</TableCell>
              <TableCell className="font-semibold text-green-600">{`${(sale.totalAmount || 0).toFixed(3)} د.ك`}</TableCell>
              <TableCell className="text-left"><Button variant="ghost" size="icon" onClick={() => handleDelete(sale.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
            </TableRow>
          )}
        />
      </div>
    </div>
  );
}


function HerdsView({ user }) {
  const collectionRef = user ? collection(db, 'users', user.uid, 'livestockHerds') : null;
  const [snapshot, loading] = useCollection(collectionRef ? query(collectionRef, orderBy('name', 'asc')) : null);
  const herds = snapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Herd)) || [];

  const [newHerd, setNewHerd] = useState({ name: '', animalCount: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    const { name, animalCount } = newHerd;
    if (!name || !animalCount || !collectionRef || isAdding) return;
    setIsAdding(true);
    try {
      await addDoc(collectionRef, { name, animalCount: parseInt(animalCount) || 0 });
      setNewHerd({ name: '', animalCount: '' });
    } catch (e) { console.error(e) }
    finally { setIsAdding(false); }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'livestockHerds', id));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>إضافة قطيع مواشي جديد</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="herd-name">اسم/نوع القطيع</Label><Input id="herd-name" placeholder="مثال: قطيع أغنام" value={newHerd.name} onChange={(e) => setNewHerd({ ...newHerd, name: e.target.value })}/></div>
            <div className="space-y-2"><Label htmlFor="herd-count">عدد الرؤوس</Label><Input id="herd-count" type="number" placeholder="مثال: 100" value={newHerd.animalCount} onChange={(e) => setNewHerd({ ...newHerd, animalCount: e.target.value })} dir="ltr" /></div>
          </div>
          <Button onClick={handleAdd} className="mt-4" disabled={isAdding}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Plus className="h-4 w-4 ml-2" />}
            {isAdding ? 'جاري الإضافة...' : 'إضافة القطيع'}
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة قطعان المواشي</h2>
        <DataView<Herd>
          loading={loading}
          data={herds}
          columns={['الاسم/النوع', 'عدد الرؤوس', 'حذف']}
          emptyMessage="لا يوجد قطعان لعرضها."
          renderRow={(herd) => (
             <TableRow key={herd.id}>
                <TableCell className="font-medium">{herd.name}</TableCell>
                <TableCell>{herd.animalCount || 0}</TableCell>
                <TableCell className="text-left">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(herd.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
          )}
        />
      </div>
    </div>
  );
}


function LivestockView({ user }) {
  const [activeTab, setActiveTab] = useState('expenses');
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="expenses"><DollarSign className="h-4 w-4 ml-2" />المصاريف</TabsTrigger>
        <TabsTrigger value="sales"><ShoppingCart className="h-4 w-4 ml-2" />المبيعات</TabsTrigger>
        <TabsTrigger value="herds"><GitCommit className="h-4 w-4 ml-2 rotate-90" />القطيع</TabsTrigger>
      </TabsList>
       <TabsContent value="expenses" className="mt-6">
          <ExpensesView user={user} collectionName="livestockExpenses" title="مصاريف المواشي"/>
       </TabsContent>
        <TabsContent value="sales" className="mt-6">
          <LivestockSalesView user={user} />
        </TabsContent>
         <TabsContent value="herds" className="mt-6">
          <HerdsView user={user} />
        </TabsContent>
    </Tabs>
  );
}

// --- Main Management View ---

export default function ManagementView() {
  const [selectedSection, setSelectedSection] = useState('farmManagement');
  const [user] = useAuthState(auth);

  const renderContent = () => {
    if (!user) {
      return (
         <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    switch (selectedSection) {
      case 'farmManagement':
        return <FarmManagementView user={user} />;
      case 'agriculture':
        return <AgricultureView user={user} />;
      case 'poultry':
        return <PoultryView user={user} />;
      case 'livestock':
        return <LivestockView user={user} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المزرعة</h1>
          <p className="mt-1 text-muted-foreground">
            اختر قسمًا لإدارة عملياته وبياناته.
          </p>
        </div>
        <Select value={selectedSection} onValueChange={setSelectedSection}>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="اختر قسمًا" />
          </SelectTrigger>
          <SelectContent>
             <SelectItem value="farmManagement">
                <div className='flex items-center'>
                    <Briefcase className="h-4 w-4 ml-2" />
                    إدارة المزرعة (العامة)
                </div>
            </SelectItem>
            <SelectItem value="agriculture">
                <div className='flex items-center'>
                    <Tractor className="h-4 w-4 ml-2" />
                    الزراعة
                </div>
            </SelectItem>
            <SelectItem value="poultry">
                 <div className='flex items-center'>
                    <Egg className="h-4 w-4 ml-2" />
                    الدواجن
                </div>
            </SelectItem>
            <SelectItem value="livestock">
                <div className='flex items-center'>
                    <GitCommit className="h-4 w-4 ml-2 rotate-90" />
                    المواشي
                </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </header>

      <div>{renderContent()}</div>
    </div>
  );
}
