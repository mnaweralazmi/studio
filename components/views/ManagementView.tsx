'use client';

import {
  DollarSign,
  ShoppingCart,
  HandCoins,
  User,
  Plus,
  Archive,
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
  Building2,
  ClipboardList,
  Home,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
  where,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

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
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from '../ui/use-toast';
import { useFirestoreQuery } from '@/lib/hooks/useFirestoreQuery';
import type { User as FirebaseUser } from 'firebase/auth';

// Helper to convert Firestore Timestamp to a readable string
const formatDate = (date: any) => {
  if (!date) return 'N/A';
  const d = date instanceof Timestamp ? date.toDate() : new Date(date);
  return d.toLocaleDateString('ar-KW');
};

// Generic Types
type Expense = {
  id: string;
  date: string | Timestamp;
  item: string;
  category: string;
  amount: number;
};
type Debt = {
  id: string;
  party: string;
  dueDate: string | Timestamp;
  amount: number;
  type: 'دين لنا' | 'دين علينا';
};
type Worker = { id: string; name: string; salary: number };
type Facility = { id: string; name: string; type: 'محمية' | 'حقلي' };

// Agriculture Types
type AgriSale = {
  id: string;
  date: string | Timestamp;
  item: string;
  cartonCount: number;
  cartonWeight: string;
  cartonPrice: number;
  totalAmount: number;
};
const vegetableOptions = ['طماطم', 'خيار', 'بطاطس', 'باذنجان', 'فلفل', 'كوسا'];

// Poultry Types
type EggSale = {
  id: string;
  date: string | Timestamp;
  trayCount: number;
  trayPrice: number;
  totalAmount: number;
};
type PoultrySale = {
  id: string;
  date: string | Timestamp;
  poultryType: string;
  count: number;
  pricePerUnit: number;
  totalAmount: number;
};
type Flock = { id: string; name: string; birdCount: number };

// Livestock Types
type LivestockSale = {
  id: string;
  date: string | Timestamp;
  animalType: string;
  count: number;
  pricePerUnit: number;
  totalAmount: number;
};
type Herd = { id: string; name: string; animalCount: number };

// Generic Loading/Empty state component
function DataView<T extends { id: string }>({
  loading,
  data,
  columns,
  renderRow,
  emptyMessage,
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
    return (
      <p className="text-muted-foreground text-center py-4">{emptyMessage}</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((col, i) => (
            <TableHead key={i} className={i === columns.length - 1 ? 'text-left' : ''}>
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>{data.map(renderRow)}</TableBody>
    </Table>
  );
}


// --- Generic Sub-page Components ---

function ExpensesView({ user, collectionName }: { user: FirebaseUser, collectionName: string }) {
  const { data: expenses, loading, refetch } = useFirestoreQuery<Expense>(collectionName, [where('archived', '==', false), orderBy('date', 'desc')], false);

  const [newExpense, setNewExpense] = useState({
    item: '',
    category: '',
    amount: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddExpense = async () => {
    if (!newExpense.item || !newExpense.amount || isAdding)
      return;
    setIsAdding(true);

    try {
      const collectionRef = collection(db, 'users', user.uid, collectionName);
      await addDoc(collectionRef, {
        date: Timestamp.now(),
        item: newExpense.item,
        category: newExpense.category,
        amount: parseFloat(newExpense.amount) || 0,
        archived: false,
      });
      setNewExpense({ item: '', category: '', amount: '' });
      if (refetch) refetch();
    } catch (e) {
      console.error('Error adding expense:', e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleArchiveExpense = async (id: string) => {
    if (!user || !collectionName) return;
    await updateDoc(doc(db, 'users', user.uid, collectionName, id), { archived: true });
    if (refetch) refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة مصروف جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item">البند</Label>
              <Input
                id="item"
                value={newExpense.item}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, item: e.target.value })
                }
                placeholder="مثال: شراء بذور"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">الفئة</Label>
              <Input
                id="category"
                value={newExpense.category}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, category: e.target.value })
                }
                placeholder="مثال: مستلزمات"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ</Label>
              <Input
                id="amount"
                type="number"
                value={newExpense.amount}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, amount: e.target.value })
                }
                placeholder="بالدينار الكويتي"
                dir="ltr"
              />
            </div>
          </div>
          <Button onClick={handleAddExpense} className="mt-4 bg-green-600 hover:bg-green-700" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isAdding ? 'جاري الإضافة...' : 'إضافة المصروف'}
          </Button>
        </CardContent>
      </Card>

      <Card>
       <CardHeader>
          <CardTitle>قائمة المصاريف</CardTitle>
        </CardHeader>
        <CardContent>
          <DataView<Expense>
            loading={loading}
            data={expenses || []}
            columns={['التاريخ', 'البند', 'الفئة', 'المبلغ', 'أرشفة']}
            emptyMessage="لا توجد مصاريف لعرضها."
            renderRow={(expense) => (
              <TableRow key={expense.id}>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell className="font-medium">{expense.item}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{expense.category}</Badge>
                </TableCell>
                <TableCell className="font-semibold text-destructive">{`${(
                  expense.amount || 0
                ).toFixed(3)} د.ك`}</TableCell>
                <TableCell className="text-left">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="أرشفة"
                    onClick={() => handleArchiveExpense(expense.id)}
                  >
                    <Archive className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Farm Management Components ---
function FacilitiesView({ user }: { user: FirebaseUser }) {
  const { data: facilities, loading, refetch } = useFirestoreQuery<Facility>('facilities', [where('archived', '==', false), orderBy('name', 'asc')], false);
  
  const [newFacility, setNewFacility] = useState({ name: '', type: 'محمية' as 'محمية' | 'حقلي' });
  const [isAdding, setIsAdding] = useState(false);
  
  const greenhouses = (facilities || []).filter(f => f.type === 'محمية').length;
  const fields = (facilities || []).filter(f => f.type === 'حقلي').length;

  const handleAdd = async () => {
    const { name, type } = newFacility;
    if (!name || !type || isAdding) return;
    setIsAdding(true);
    try {
      const collectionRef = collection(db, 'users', user.uid, 'facilities');
      await addDoc(collectionRef, { name, type, archived: false, createdAt: Timestamp.now() });
      setNewFacility({ name: '', type: 'محمية' });
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'facilities', id), { archived: true });
    if (refetch) refetch();
  };

  return (
    <div className="space-y-6">
       <div className="grid gap-4 grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">عدد المحميات</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{greenhouses}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">عدد الحقول</CardTitle>
                    <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{fields}</div>
                </CardContent>
            </Card>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>إضافة مرفق جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facility-name">اسم المرفق</Label>
              <Input
                id="facility-name"
                placeholder="مثال: محمية رقم 1"
                value={newFacility.name}
                onChange={(e) =>
                  setNewFacility({ ...newFacility, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">نوع المرفق</Label>
              <Select value={newFacility.type} onValueChange={(value: 'محمية' | 'حقلي') => setNewFacility({ ...newFacility, type: value })}>
                <SelectTrigger id="type"><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                <SelectContent><SelectItem value="محمية">محمية</SelectItem><SelectItem value="حقلي">حقلي</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAdd} className="mt-4" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isAdding ? 'جاري الإضافة...' : 'إضافة المرفق'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المرافق</CardTitle>
        </CardHeader>
        <CardContent>
          <DataView<Facility>
            loading={loading}
            data={facilities || []}
            columns={['الاسم', 'النوع', 'أرشفة']}
            emptyMessage="لا توجد مرافق لعرضها."
            renderRow={(facility) => (
              <TableRow key={facility.id}>
                <TableCell className="font-medium">{facility.name}</TableCell>
                <TableCell><Badge variant="secondary">{facility.type}</Badge></TableCell>
                <TableCell className="text-left">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="أرشفة"
                    onClick={() => handleArchive(facility.id)}
                  >
                    <Archive className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// --- Agriculture Components ---
function AgriSalesView({ user }: { user: FirebaseUser }) {
  const { data: sales, loading, refetch } = useFirestoreQuery<AgriSale>('agriSales', [where('archived', '==', false), orderBy('date', 'desc')], false);

  const [newSale, setNewSale] = useState({
    item: '',
    cartonCount: '',
    cartonWeight: '',
    cartonPrice: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSale = async () => {
    const { item, cartonCount, cartonWeight, cartonPrice } = newSale;
    if (
      !item ||
      !cartonCount ||
      !cartonWeight ||
      !cartonPrice ||
      isAdding
    )
      return;

    setIsAdding(true);
    const count = parseFloat(cartonCount) || 0;
    const price = parseFloat(cartonPrice) || 0;
    const totalAmount = count * price;

    try {
      const salesCollection = collection(db, 'users', user.uid, 'agriSales');
      await addDoc(salesCollection, {
        date: Timestamp.now(),
        item,
        cartonCount: count,
        cartonWeight,
        cartonPrice: price,
        totalAmount,
        archived: false,
      });
      setNewSale({
        item: '',
        cartonCount: '',
        cartonWeight: '',
        cartonPrice: '',
      });
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleArchiveSale = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'agriSales', id), { archived: true });
    if (refetch) refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة بيع جديد (زراعي)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item">المنتج</Label>
              <Select
                value={newSale.item}
                onValueChange={(value) =>
                  setNewSale({ ...newSale, item: value })
                }
              >
                <SelectTrigger id="item">
                  <SelectValue placeholder="اختر نوع الخضار" />
                </SelectTrigger>
                <SelectContent>
                  {vegetableOptions.map((veg) => (
                    <SelectItem key={veg} value={veg}>
                      {veg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cartonCount">عدد الكراتين</Label>
              <Input
                id="cartonCount"
                type="number"
                placeholder="مثال: 50"
                value={newSale.cartonCount}
                onChange={(e) =>
                  setNewSale({ ...newSale, cartonCount: e.target.value })
                }
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cartonWeight">وزن الكرتون</Label>
              <Input
                id="cartonWeight"
                placeholder="مثال: 10 كيلو"
                value={newSale.cartonWeight}
                onChange={(e) =>
                  setNewSale({ ...newSale, cartonWeight: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cartonPrice">سعر الكرتون</Label>
              <Input
                id="cartonPrice"
                type="number"
                placeholder="بالدينار الكويتي"
                value={newSale.cartonPrice}
                onChange={(e) =>
                  setNewSale({ ...newSale, cartonPrice: e.target.value })
                }
                dir="ltr"
              />
            </div>
          </div>
          <Button onClick={handleAddSale} className="mt-4" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isAdding ? 'جاري الإضافة...' : 'إضافة البيع'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المبيعات الزراعية</CardTitle>
        </CardHeader>
        <CardContent>
        <DataView<AgriSale>
          loading={loading}
          data={sales || []}
          columns={[
            'التاريخ',
            'المنتج',
            'عدد الكراتين',
            'وزن الكرتون',
            'سعر الكرتون',
            'المبلغ الإجمالي',
            'أرشفة',
          ]}
          emptyMessage="لا توجد مبيعات لعرضها."
          renderRow={(sale) => (
            <TableRow key={sale.id}>
              <TableCell>{formatDate(sale.date)}</TableCell>
              <TableCell className="font-medium">{sale.item}</TableCell>
              <TableCell>{sale.cartonCount || 0}</TableCell>
              <TableCell>{sale.cartonWeight}</TableCell>
              <TableCell>{`${(sale.cartonPrice || 0).toFixed(
                3
              )} د.ك`}</TableCell>
              <TableCell className="font-semibold text-green-600">{`${(
                sale.totalAmount || 0
              ).toFixed(3)} د.ك`}</TableCell>
              <TableCell className="text-left">
                <Button
                  variant="ghost"
                  size="icon"
                  title="أرشفة"
                  onClick={() => handleArchiveSale(sale.id)}
                >
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          )}
        />
        </CardContent>
      </Card>
    </div>
  );
}

function DebtsView({ user }: { user: FirebaseUser }) {
  const { data: debts, loading, refetch } = useFirestoreQuery<Debt>('debts', [where('archived', '==', false), orderBy('dueDate', 'desc')], false);

  const [newDebt, setNewDebt] = useState({
    party: '',
    amount: '',
    type: 'دين علينا' as 'دين لنا' | 'دين علينا',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleAddDebt = async () => {
    const { party, amount, type } = newDebt;
    if (!party || !amount || isAdding) return;
    setIsAdding(true);

    try {
      const debtsCollection = collection(db, 'users', user.uid, 'debts');
      await addDoc(debtsCollection, {
        party,
        dueDate: Timestamp.now(),
        amount: parseFloat(amount) || 0,
        type,
        archived: false,
      });
      setNewDebt({ party: '', amount: '', type: 'دين علينا' });
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleArchiveDebt = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'debts', id), { archived: true });
    if (refetch) refetch();
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
        await updateDoc(debtRef, { amount: 0, archived: true });
      }
      toast({
          title: "تم السداد بنجاح",
          description: `تم سداد مبلغ ${paymentValue.toFixed(3)} د.ك من دين ${selectedDebt.party}.`,
          className: "bg-green-600 text-white"
      });
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
      toast({
          title: "خطأ",
          description: "لم نتمكن من معالجة عملية السداد.",
          variant: "destructive"
      });
    } finally {
      setPaymentDialogOpen(false);
      setSelectedDebt(null);
      setPaymentAmount('');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة دين جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="party">الجهة</Label>
              <Input
                id="party"
                placeholder="مثال: مورد الأسمدة"
                value={newDebt.party}
                onChange={(e) => setNewDebt({ ...newDebt, party: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ</Label>
              <Input
                id="amount"
                type="number"
                placeholder="بالدينار الكويتي"
                value={newDebt.amount}
                onChange={(e) =>
                  setNewDebt({ ...newDebt, amount: e.target.value })
                }
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">نوع الدين</Label>
              <Select
                value={newDebt.type}
                onValueChange={(value: 'دين لنا' | 'دين علينا') =>
                  setNewDebt({ ...newDebt, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="دين علينا">دين علينا</SelectItem>
                  <SelectItem value="دين لنا">دين لنا</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddDebt} className="mt-4" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isAdding ? 'جاري الإضافة...' : 'إضافة الدين'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة الديون</CardTitle>
        </CardHeader>
        <CardContent>
          <DataView<Debt>
            loading={loading}
            data={debts || []}
            columns={['الجهة', 'تاريخ الاستحقاق', 'نوع الدين', 'المبلغ', 'الإجراءات']}
            emptyMessage="لا توجد ديون لعرضها."
            renderRow={(debt) => (
              <TableRow key={debt.id}>
                <TableCell className="font-medium">{debt.party}</TableCell>
                <TableCell>{formatDate(debt.dueDate)}</TableCell>
                <TableCell>
                  <Badge variant={debt.type === 'دين لنا' ? 'default' : 'destructive'}>
                    {debt.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`font-semibold ${
                    debt.type === 'دين لنا' ? 'text-green-600' : 'text-destructive'
                  }`}
                >{`${(debt.amount || 0).toFixed(3)} د.ك`}</TableCell>
                <TableCell className="text-left flex items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenPaymentDialog(debt)}
                    className="flex items-center gap-1"
                  >
                    <CreditCard className="h-4 w-4" />
                    سداد
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="أرشفة"
                    onClick={() => handleArchiveDebt(debt.id)}
                  >
                    <Archive className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          />
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>سداد دين</DialogTitle>
            <DialogDescription>
              {selectedDebt && `أنت على وشك سداد دين لـ ${selectedDebt.party}.`}
            </DialogDescription>
          </DialogHeader>
          {selectedDebt && (
            <div className="grid gap-4 py-4">
              <p>
                المبلغ المتبقي:
                <span className="font-bold text-destructive">
                  {' '}
                  {(selectedDebt.amount || 0).toFixed(3)} د.ك
                </span>
              </p>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-amount" className="text-right">
                  مبلغ السداد
                </Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
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
            <Button onClick={handleProcessPayment}>
              <CheckCircle className="h-4 w-4 ml-2" />
              تأكيد السداد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WorkersView({ user }: { user: FirebaseUser }) {
  const { data: workers, loading, refetch } = useFirestoreQuery<Worker>('workers', [where('archived', '==', false), orderBy('name', 'asc')], false);

  const [newWorker, setNewWorker] = useState({ name: '', salary: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [payingSalaryFor, setPayingSalaryFor] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [newSalary, setNewSalary] = useState('');

  const handleAddWorker = async () => {
    const { name, salary } = newWorker;
    if (!name || !salary || isAdding) return;
    setIsAdding(true);
    try {
      const workersCollection = collection(db, 'users', user.uid, 'workers');
      await addDoc(workersCollection, { name, salary: parseFloat(salary) || 0, archived: false, createdAt: Timestamp.now() });
      setNewWorker({ name: '', salary: '' });
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleArchiveWorker = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'workers', id), { archived: true });
    if (refetch) refetch();
  };

  const handleSalaryPayment = async (worker: Worker) => {
    if (!worker || !worker.id) return;
    setPayingSalaryFor(worker.id);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    try {
      const expensesCollection = collection(db, 'users', user.uid, 'expenses');
      await addDoc(expensesCollection, {
        date: Timestamp.now(),
        item: `راتب العامل: ${worker.name} (شهر ${currentMonth}/${currentYear})`,
        category: 'رواتب',
        amount: worker.salary || 0,
        archived: false,
      });
      toast({
          title: "تم دفع الراتب بنجاح",
          description: `تم تسجيل راتب ${worker.name} كمصروف.`,
          className: "bg-green-600 text-white"
      });
    } catch (e) {
      console.error(e);
       toast({
          title: "خطأ",
          description: "لم نتمكن من تسجيل عملية دفع الراتب.",
          variant: "destructive"
      });
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
       toast({
          title: "تم تحديث الراتب",
          description: `تم تحديث راتب ${editingWorker.name} بنجاح.`,
          className: "bg-green-600 text-white"
      });
      if (refetch) refetch();
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
      <Card>
        <CardHeader>
          <CardTitle>إضافة عامل جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم العامل</Label>
              <Input
                id="name"
                placeholder="مثال: أحمد عبدالله"
                value={newWorker.name}
                onChange={(e) =>
                  setNewWorker({ ...newWorker, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">راتب العامل</Label>
              <Input
                id="salary"
                type="number"
                placeholder="بالدينار الكويتي"
                value={newWorker.salary}
                onChange={(e) =>
                  setNewWorker({ ...newWorker, salary: e.target.value })
                }
                dir="ltr"
              />
            </div>
          </div>
          <Button onClick={handleAddWorker} className="mt-4" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isAdding ? 'جاري الإضافة...' : 'إضافة العامل'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة العمال</CardTitle>
        </CardHeader>
        <CardContent>
          <DataView<Worker>
            loading={loading}
            data={workers || []}
            columns={['الاسم', 'راتب العامل', 'الإجراءات']}
            emptyMessage="لا يوجد عمال لعرضهم."
            renderRow={(worker) => (
              <TableRow key={worker.id}>
                <TableCell className="font-medium flex items-center">
                  <div className="p-2 rounded-lg border bg-secondary/30 mr-3 rtl:mr-0 rtl:ml-3">
                    <User className="h-6 w-6 text-primary" />
                  </div>
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
                      {payingSalaryFor === worker.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      title="أرشفة"
                      onClick={() => handleArchiveWorker(worker.id)}
                      disabled={payingSalaryFor === worker.id}
                    >
                      <Archive className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          />
        </CardContent>
      </Card>

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

function FarmManagementView({ user }: { user: FirebaseUser }) {
  return (
    <Tabs defaultValue="expenses" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="expenses" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          المصاريف العامة
        </TabsTrigger>
        <TabsTrigger value="debts" className="flex items-center gap-2">
          <HandCoins className="h-4 w-4" />
          الديون
        </TabsTrigger>
        <TabsTrigger value="workers" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          العمال
        </TabsTrigger>
      </TabsList>
      <TabsContent value="expenses" className="mt-6">
        <ExpensesView
          user={user}
          collectionName="expenses"
        />
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

function AgricultureView({ user }: { user: FirebaseUser }) {
  return (
    <Tabs defaultValue="expenses" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="expenses" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          المصاريف
        </TabsTrigger>
        <TabsTrigger value="sales" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          المبيعات
        </TabsTrigger>
        <TabsTrigger value="facilities" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          المرافق
        </TabsTrigger>
      </TabsList>
      <TabsContent value="expenses" className="mt-6">
        <ExpensesView
          user={user}
          collectionName="agriExpenses"
        />
      </TabsContent>
      <TabsContent value="sales" className="mt-6">
        <AgriSalesView user={user} />
      </TabsContent>
      <TabsContent value="facilities" className="mt-6">
        <FacilitiesView user={user} />
      </TabsContent>
    </Tabs>
  );
}

// --- Poultry Components ---

function EggSalesView({ user }: { user: FirebaseUser }) {
  const { data: sales, loading, refetch } = useFirestoreQuery<EggSale>('poultryEggSales', [where('archived', '==', false), orderBy('date', 'desc')], false);

  const [newSale, setNewSale] = useState({ trayCount: '', trayPrice: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSale = async () => {
    const { trayCount, trayPrice } = newSale;
    if (!trayCount || !trayPrice || isAdding) return;

    setIsAdding(true);
    const count = parseFloat(trayCount) || 0;
    const price = parseFloat(trayPrice) || 0;
    const totalAmount = count * price;

    try {
      const collectionRef = collection(db, 'users', user.uid, 'poultryEggSales');
      await addDoc(collectionRef, {
        date: Timestamp.now(),
        trayCount: count,
        trayPrice: price,
        totalAmount,
        archived: false,
      });
      setNewSale({ trayCount: '', trayPrice: '' });
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'poultryEggSales', id), { archived: true });
    if (refetch) refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة بيع بيض جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trayCount">عدد الأطباق</Label>
              <Input
                id="trayCount"
                type="number"
                placeholder="مثال: 100"
                value={newSale.trayCount}
                onChange={(e) =>
                  setNewSale({ ...newSale, trayCount: e.target.value })
                }
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trayPrice">سعر الطبق</Label>
              <Input
                id="trayPrice"
                type="number"
                placeholder="بالدينار الكويتي"
                value={newSale.trayPrice}
                onChange={(e) =>
                  setNewSale({ ...newSale, trayPrice: e.target.value })
                }
                dir="ltr"
              />
            </div>
          </div>
          <Button onClick={handleAddSale} className="mt-4" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isAdding ? 'جاري الإضافة...' : 'إضافة البيع'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة مبيعات البيض</CardTitle>
        </CardHeader>
        <CardContent>
          <DataView<EggSale>
            loading={loading}
            data={sales || []}
            columns={['التاريخ', 'عدد الأطباق', 'سعر الطبق', 'المبلغ الإجمالي', 'أرشفة']}
            emptyMessage="لا توجد مبيعات بيض لعرضها."
            renderRow={(sale) => (
              <TableRow key={sale.id}>
                <TableCell>{formatDate(sale.date)}</TableCell>
                <TableCell>{sale.trayCount || 0}</TableCell>
                <TableCell>{`${(sale.trayPrice || 0).toFixed(
                  3
                )} د.ك`}</TableCell>
                <TableCell className="font-semibold text-green-600">{`${(
                  sale.totalAmount || 0
                ).toFixed(3)} د.ك`}</TableCell>
                <TableCell className="text-left">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="أرشفة"
                    onClick={() => handleArchive(sale.id)}
                  >
                    <Archive className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PoultrySalesView({ user }: { user: FirebaseUser }) {
  const { data: sales, loading, refetch } = useFirestoreQuery<PoultrySale>('poultrySales', [where('archived', '==', false), orderBy('date', 'desc')], false);

  const [newSale, setNewSale] = useState({
    poultryType: 'دجاج حي',
    count: '',
    pricePerUnit: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSale = async () => {
    const { poultryType, count, pricePerUnit } = newSale;
    if (!poultryType || !count || !pricePerUnit || isAdding)
      return;

    setIsAdding(true);
    const numCount = parseFloat(count) || 0;
    const price = parseFloat(pricePerUnit) || 0;
    const totalAmount = numCount * price;

    try {
      const collectionRef = collection(db, 'users', user.uid, 'poultrySales');
      await addDoc(collectionRef, {
        date: Timestamp.now(),
        poultryType,
        count: numCount,
        pricePerUnit: price,
        totalAmount,
        archived: false,
      });
      setNewSale({ poultryType: 'دجاج حي', count: '', pricePerUnit: '' });
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'poultrySales', id), { archived: true });
    if (refetch) refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة بيع دواجن جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poultryType">النوع</Label>
              <Input
                id="poultryType"
                placeholder="مثال: دجاج حي"
                value={newSale.poultryType}
                onChange={(e) =>
                  setNewSale({ ...newSale, poultryType: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">العدد</Label>
              <Input
                id="count"
                type="number"
                placeholder="مثال: 20"
                value={newSale.count}
                onChange={(e) =>
                  setNewSale({ ...newSale, count: e.target.value })
                }
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">سعر الوحدة</Label>
              <Input
                id="pricePerUnit"
                type="number"
                placeholder="بالدينار الكويتي"
                value={newSale.pricePerUnit}
                onChange={(e) =>
                  setNewSale({ ...newSale, pricePerUnit: e.target.value })
                }
                dir="ltr"
              />
            </div>
          </div>
          <Button onClick={handleAddSale} className="mt-4" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isAdding ? 'جاري الإضافة...' : 'إضافة البيع'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة مبيعات الدواجن</CardTitle>
        </CardHeader>
        <CardContent>
        <DataView<PoultrySale>
          loading={loading}
          data={sales || []}
          columns={[
            'التاريخ',
            'النوع',
            'العدد',
            'سعر الوحدة',
            'المبلغ الإجمالي',
            'أرشفة',
          ]}
          emptyMessage="لا توجد مبيعات دواجن لعرضها."
          renderRow={(sale) => (
            <TableRow key={sale.id}>
              <TableCell>{formatDate(sale.date)}</TableCell>
              <TableCell>{sale.poultryType}</TableCell>
              <TableCell>{sale.count || 0}</TableCell>
              <TableCell>{`${(sale.pricePerUnit || 0).toFixed(
                3
              )} د.ك`}</TableCell>
              <TableCell className="font-semibold text-green-600">{`${(
                sale.totalAmount || 0
              ).toFixed(3)} د.ك`}</TableCell>
              <TableCell className="text-left">
                <Button
                  variant="ghost"
                  size="icon"
                  title="أرشفة"
                  onClick={() => handleArchive(sale.id)}
                >
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          )}
        />
        </CardContent>
      </Card>
    </div>
  );
}

function FlocksView({ user }: { user: FirebaseUser }) {
  const { data: flocks, loading, refetch } = useFirestoreQuery<Flock>('poultryFlocks', [where('archived', '==', false), orderBy('name', 'asc')], false);

  const [newFlock, setNewFlock] = useState({ name: '', birdCount: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    const { name, birdCount } = newFlock;
    if (!name || !birdCount || isAdding) return;
    setIsAdding(true);
    try {
      const collectionRef = collection(db, 'users', user.uid, 'poultryFlocks');
      await addDoc(collectionRef, {
        name,
        birdCount: parseInt(birdCount) || 0,
        archived: false,
        createdAt: Timestamp.now()
      });
      setNewFlock({ name: '', birdCount: '' });
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'poultryFlocks', id), { archived: true });
    if (refetch) refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة قطيع دواجن جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flock-name">اسم/نوع القطيع</Label>
              <Input
                id="flock-name"
                placeholder="مثال: قطيع بياض #1"
                value={newFlock.name}
                onChange={(e) =>
                  setNewFlock({ ...newFlock, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flock-count">عدد الطيور</Label>
              <Input
                id="flock-count"
                type="number"
                placeholder="مثال: 500"
                value={newFlock.birdCount}
                onChange={(e) =>
                  setNewFlock({ ...newFlock, birdCount: e.target.value })
                }
                dir="ltr"
              />
            </div>
          </div>
          <Button onClick={handleAdd} className="mt-4" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isAdding ? 'جاري الإضافة...' : 'إضافة القطيع'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة قطعان الدواجن</CardTitle>
        </CardHeader>
        <CardContent>
        <DataView<Flock>
          loading={loading}
          data={flocks || []}
          columns={['الاسم/النوع', 'عدد الطيور', 'أرشفة']}
          emptyMessage="لا يوجد قطعان لعرضها."
          renderRow={(flock) => (
            <TableRow key={flock.id}>
              <TableCell className="font-medium">{flock.name}</TableCell>
              <TableCell>{flock.birdCount || 0}</TableCell>
              <TableCell className="text-left">
                <Button
                  variant="ghost"
                  size="icon"
                  title="أرشفة"
                  onClick={() => handleArchive(flock.id)}
                >
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          )}
        />
        </CardContent>
      </Card>
    </div>
  );
}

function PoultryView({ user }: { user: FirebaseUser }) {
  return (
    <Tabs defaultValue="expenses" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="expenses" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          المصاريف
        </TabsTrigger>
        <TabsTrigger value="eggSales" className="flex items-center gap-2">
          <Egg className="h-4 w-4" />
          مبيعات البيض
        </TabsTrigger>
        <TabsTrigger value="poultrySales" className="flex items-center gap-2">
          <Drumstick className="h-4 w-4" />
          مبيعات الدواجن
        </TabsTrigger>
        <TabsTrigger value="flocks" className="flex items-center gap-2">
          <Users2 className="h-4 w-4" />
          القطعان
        </TabsTrigger>
      </TabsList>
      <TabsContent value="expenses" className="mt-6">
        <ExpensesView
          user={user}
          collectionName="poultryExpenses"
        />
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

function LivestockSalesView({ user }: { user: FirebaseUser }) {
  const { data: sales, loading, refetch } = useFirestoreQuery<LivestockSale>('livestockSales', [where('archived', '==', false), orderBy('date', 'desc')], false);

  const [newSale, setNewSale] = useState({
    animalType: 'خروف',
    count: '',
    pricePerUnit: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSale = async () => {
    const { animalType, count, pricePerUnit } = newSale;
    if (!animalType || !count || !pricePerUnit || isAdding)
      return;

    setIsAdding(true);
    const numCount = parseFloat(count) || 0;
    const price = parseFloat(pricePerUnit) || 0;
    const totalAmount = numCount * price;

    try {
      const collectionRef = collection(db, 'users', user.uid, 'livestockSales');
      await addDoc(collectionRef, {
        date: Timestamp.now(),
        animalType,
        count: numCount,
        pricePerUnit: price,
        totalAmount,
        archived: false,
      });
      setNewSale({ animalType: 'خروف', count: '', pricePerUnit: '' });
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'livestockSales', id), { archived: true });
    if (refetch) refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة بيع مواشي جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="animalType">نوع الحيوان</Label>
              <Input
                id="animalType"
                placeholder="مثال: خروف نعيمي"
                value={newSale.animalType}
                onChange={(e) =>
                  setNewSale({ ...newSale, animalType: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="count">العدد</Label>
              <Input
                id="count"
                type="number"
                placeholder="مثال: 5"
                value={newSale.count}
                onChange={(e) =>
                  setNewSale({ ...newSale, count: e.target.value })
                }
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerUnit">سعر الرأس</Label>
              <Input
                id="pricePerUnit"
                type="number"
                placeholder="بالدينار الكويتي"
                value={newSale.pricePerUnit}
                onChange={(e) =>
                  setNewSale({ ...newSale, pricePerUnit: e.target.value })
                }
                dir="ltr"
              />
            </div>
          </div>
          <Button onClick={handleAddSale} className="mt-4" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isAdding ? 'جاري الإضافة...' : 'إضافة البيع'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة مبيعات المواشي</CardTitle>
        </CardHeader>
        <CardContent>
        <DataView<LivestockSale>
          loading={loading}
          data={sales || []}
          columns={[
            'التاريخ',
            'النوع',
            'العدد',
            'سعر الرأس',
            'المبلغ الإجمالي',
            'أرشفة',
          ]}
          emptyMessage="لا توجد مبيعات مواشي لعرضها."
          renderRow={(sale) => (
            <TableRow key={sale.id}>
              <TableCell>{formatDate(sale.date)}</TableCell>
              <TableCell>{sale.animalType}</TableCell>
              <TableCell>{sale.count || 0}</TableCell>
              <TableCell>{`${(sale.pricePerUnit || 0).toFixed(
                3
              )} د.ك`}</TableCell>
              <TableCell className="font-semibold text-green-600">{`${(
                sale.totalAmount || 0
              ).toFixed(3)} د.ك`}</TableCell>
              <TableCell className="text-left">
                <Button
                  variant="ghost"
                  size="icon"
                  title="أرشفة"
                  onClick={() => handleArchive(sale.id)}
                >
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          )}
        />
        </CardContent>
      </Card>
    </div>
  );
}

function HerdsView({ user }: { user: FirebaseUser }) {
  const { data: herds, loading, refetch } = useFirestoreQuery<Herd>('livestockHerds', [where('archived', '==', false), orderBy('name', 'asc')], false);

  const [newHerd, setNewHerd] = useState({ name: '', animalCount: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    const { name, animalCount } = newHerd;
    if (!name || !animalCount || isAdding) return;
    setIsAdding(true);
    try {
      const collectionRef = collection(db, 'users', user.uid, 'livestockHerds');
      await addDoc(collectionRef, {
        name,
        animalCount: parseInt(animalCount) || 0,
        archived: false,
        createdAt: Timestamp.now(),
      });
      setNewHerd({ name: '', animalCount: '' });
      if (refetch) refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdding(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid, 'livestockHerds', id), { archived: true });
    if (refetch) refetch();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة قطيع مواشي جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="herd-name">اسم/نوع القطيع</Label>
              <Input
                id="herd-name"
                placeholder="مثال: قطيع أغنام"
                value={newHerd.name}
                onChange={(e) =>
                  setNewHerd({ ...newHerd, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="herd-count">عدد الرؤوس</Label>
              <Input
                id="herd-count"
                type="number"
                placeholder="مثال: 100"
                value={newHerd.animalCount}
                onChange={(e) =>
                  setNewHerd({ ...newHerd, animalCount: e.target.value })
                }
                dir="ltr"
              />
            </div>
          </div>
          <Button onClick={handleAdd} className="mt-4" disabled={isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
            ) : (
              <Plus className="h-4 w-4 ml-2" />
            )}
            {isAdding ? 'جاري الإضافة...' : 'إضافة القطيع'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>قائمة قطعان المواشي</CardTitle>
        </CardHeader>
        <CardContent>
        <DataView<Herd>
          loading={loading}
          data={herds || []}
          columns={['الاسم/النوع', 'عدد الرؤوس', 'أرشفة']}
          emptyMessage="لا يوجد قطعان لعرضها."
          renderRow={(herd) => (
            <TableRow key={herd.id}>
              <TableCell className="font-medium">{herd.name}</TableCell>
              <TableCell>{herd.animalCount || 0}</TableCell>
              <TableCell className="text-left">
                <Button
                  variant="ghost"
                  size="icon"
                  title="أرشفة"
                  onClick={() => handleArchive(herd.id)}
                >
                  <Archive className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TableCell>
            </TableRow>
          )}
        />
        </CardContent>
      </Card>
    </div>
  );
}

function LivestockView({ user }: { user: FirebaseUser }) {
  return (
    <Tabs defaultValue="expenses" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="expenses" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          المصاريف
        </TabsTrigger>
        <TabsTrigger value="sales" className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          المبيعات
        </TabsTrigger>
        <TabsTrigger value="herds" className="flex items-center gap-2">
          <GitCommit className="h-4 w-4 rotate-90" />
          القطعان
        </TabsTrigger>
      </TabsList>
      <TabsContent value="expenses" className="mt-6">
        <ExpensesView
          user={user}
          collectionName="livestockExpenses"
        />
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
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  
  const [user, loadingUser] = useAuthState(auth);

  const availableTabs = [
    { value: 'farmManagement', label: 'الإدارة', icon: Briefcase },
    { value: 'agriculture', label: 'الزراعة', icon: Tractor },
    { value: 'poultry', label: 'الدواجن', icon: Egg },
    { value: 'livestock', label: 'المواشي', icon: GitCommit, rotate: true },
  ];

  const [selectedSection, setSelectedSection] = useState(tab || 'farmManagement');

  useEffect(() => {
    if (tab && availableTabs.some(t => t.value === tab)) {
      setSelectedSection(tab);
    }
  }, [tab, availableTabs]);

  
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إدارة المزرعة</h1>
          <p className="mt-1 text-muted-foreground">
            اختر قسمًا لإدارة عملياته وبياناته.
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
        <div className="flex justify-center">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto max-w-2xl">
            {availableTabs.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="flex items-center justify-center gap-2 h-12 text-xs sm:text-sm">
                    <t.icon className={cn('h-5 w-5', t.rotate && 'rotate-90')} />
                    {t.label}
                </TabsTrigger>
                ))}
            </TabsList>
        </div>

        {loadingUser ? (
           <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : !user ? null : (
          <>
            <TabsContent value="farmManagement" className="mt-6">
              <FarmManagementView user={user} />
            </TabsContent>
            <TabsContent value="agriculture" className="mt-6">
              <AgricultureView user={user} />
            </TabsContent>
            <TabsContent value="poultry" className="mt-6">
              <PoultryView user={user} />
            </TabsContent>
            <TabsContent value="livestock" className="mt-6">
              <LivestockView user={user} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
