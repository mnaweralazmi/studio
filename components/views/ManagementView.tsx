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
} from 'lucide-react';
import { useState } from 'react';
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

// Types
type Expense = {
  id: string;
  date: string;
  item: string;
  category: string;
  amount: string;
};

type Sale = {
  id: string;
  date: string;
  item: string;
  cartonCount: string;
  cartonWeight: string;
  cartonPrice: string;
  totalAmount: string;
};

type Debt = {
  id: string;
  party: string;
  dueDate: string;
  amount: number;
  type: 'دين لنا' | 'دين علينا';
};

type Worker = {
  id: string;
  name: string;
  salary: string;
};

// Initial Data
const initialExpenses: Expense[] = [];

const initialSales: Sale[] = [];

const initialDebts: Debt[] = [];

const initialWorkers: Worker[] = [];

const vegetableOptions = ['طماطم', 'خيار', 'بطاطس', 'باذنجان', 'فلفل', 'كوسا'];

// Sub-page Components

function ExpensesView() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [newExpense, setNewExpense] = useState({
    item: '',
    category: '',
    amount: '',
  });

  const handleAddExpense = () => {
    if (!newExpense.item || !newExpense.amount) return;
    const newId = `expense-${Date.now()}`;
    const today = new Date();
    const newDate = new Intl.DateTimeFormat('ar-KW-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(today);

    setExpenses([
      {
        id: newId,
        date: newDate,
        ...newExpense,
        amount: `${newExpense.amount} د.ك`,
      },
      ...expenses,
    ]);
    setNewExpense({ item: '', category: '', amount: '' });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
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
                placeholder="مثال: مستلزمات زراعية"
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
          <Button onClick={handleAddExpense} className="mt-4">
            <Plus className="h-4 w-4 ml-2" />
            إضافة المصروف
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة المصاريف</h2>
        {expenses.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>البند</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead className="text-left">حذف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell className="font-medium">{expense.item}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{expense.category}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-destructive">
                    {expense.amount}
                  </TableCell>
                  <TableCell className="text-left">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            لا توجد مصاريف لعرضها.
          </p>
        )}
      </div>
    </div>
  );
}

function SalesView() {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [newSale, setNewSale] = useState({
    item: '',
    cartonCount: '',
    cartonWeight: '',
    cartonPrice: '',
  });

   const handleAddSale = () => {
    const { item, cartonCount, cartonWeight, cartonPrice } = newSale;
    if (!item || !cartonCount || !cartonWeight || !cartonPrice) return;
    
    const newId = `sale-${Date.now()}`;
    const today = new Date();
    const newDate = new Intl.DateTimeFormat('ar-KW-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(today);

    const totalAmountValue = parseFloat(cartonCount) * parseFloat(cartonPrice);

    setSales([
      {
        id: newId,
        date: newDate,
        item,
        cartonCount,
        cartonWeight,
        cartonPrice: `${parseFloat(cartonPrice).toFixed(2)} د.ك`,
        totalAmount: `${totalAmountValue.toFixed(2)} د.ك`,
      },
      ...sales,
    ]);
    setNewSale({ item: '', cartonCount: '', cartonWeight: '', cartonPrice: '' });
  };

  const handleDeleteSale = (id: string) => {
    setSales(sales.filter((sale) => sale.id !== id));
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-foreground sr-only">المبيعات</h1>
      <Card>
        <CardHeader>
          <CardTitle>إضافة بيع جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item">المنتج</Label>
              <Select
                value={newSale.item}
                onValueChange={(value) => setNewSale({ ...newSale, item: value })}
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
          <Button onClick={handleAddSale} className="mt-4">
            <Plus className="h-4 w-4 ml-2" />
            إضافة البيع
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة المبيعات</h2>
        {sales.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>التاريخ</TableHead>
                <TableHead>المنتج</TableHead>
                <TableHead>عدد الكراتين</TableHead>
                <TableHead>وزن الكرتون</TableHead>
                <TableHead>سعر الكرتون</TableHead>
                <TableHead>المبلغ الإجمالي</TableHead>
                <TableHead className="text-left">حذف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell className="font-medium">{sale.item}</TableCell>
                  <TableCell>{sale.cartonCount}</TableCell>
                  <TableCell>{sale.cartonWeight}</TableCell>
                  <TableCell>{sale.cartonPrice}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {sale.totalAmount}
                  </TableCell>
                  <TableCell className="text-left">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSale(sale.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            لا توجد مبيعات لعرضها.
          </p>
        )}
      </div>
    </div>
  );
}

function DebtsView() {
    const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [newDebt, setNewDebt] = useState({
    party: '',
    amount: '',
    type: 'دين علينا' as 'دين لنا' | 'دين علينا',
  });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  const handleAddDebt = () => {
    const { party, amount, type } = newDebt;
    if (!party || !amount) return;

    const newId = `debt-${Date.now()}`;
    const today = new Date();
    const newDueDate = new Intl.DateTimeFormat('ar-KW-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(today);

    setDebts([
      {
        id: newId,
        party,
        dueDate: newDueDate,
        amount: parseFloat(amount),
        type,
      },
      ...debts,
    ]);
    setNewDebt({ party: '', amount: '', type: 'دين علينا' });
  };

  const handleDeleteDebt = (id: string) => {
    setDebts(debts.filter((debt) => debt.id !== id));
  };

  const handleOpenPaymentDialog = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.amount.toString());
    setPaymentDialogOpen(true);
  };

  const handleProcessPayment = () => {
    if (!selectedDebt || !paymentAmount) return;

    const paymentValue = parseFloat(paymentAmount);
    if (isNaN(paymentValue) || paymentValue <= 0) return;

    const updatedDebts = debts
      .map((debt) => {
        if (debt.id === selectedDebt.id) {
          const newAmount = debt.amount - paymentValue;
          return { ...debt, amount: newAmount > 0 ? newAmount : 0 };
        }
        return debt;
      })
      .filter((debt) => debt.amount > 0);

    setDebts(updatedDebts);
    setPaymentDialogOpen(false);
    setSelectedDebt(null);
    setPaymentAmount('');
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-foreground sr-only">الديون</h1>
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
                onChange={(e) =>
                  setNewDebt({ ...newDebt, party: e.target.value })
                }
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
          <Button onClick={handleAddDebt} className="mt-4">
            <Plus className="h-4 w-4 ml-2" />
            إضافة الدين
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة الديون</h2>
        {debts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الجهة</TableHead>
                <TableHead>تاريخ الاستحقاق</TableHead>
                <TableHead>نوع الدين</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead className="text-left">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {debts.map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell className="font-medium">{debt.party}</TableCell>
                  <TableCell>{debt.dueDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        debt.type === 'دين لنا' ? 'default' : 'destructive'
                      }
                    >
                      {debt.type}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`font-semibold ${
                      debt.type === 'دين لنا'
                        ? 'text-green-600'
                        : 'text-destructive'
                    }`}
                  >
                    {`${debt.amount.toFixed(2)} د.ك`}
                  </TableCell>
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
                      onClick={() => handleDeleteDebt(debt.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            لا توجد ديون لعرضها.
          </p>
        )}
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>سداد دين</DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="grid gap-4 py-4">
              <p>
                أنت على وشك سداد دين لـ
                <span className="font-bold"> {selectedDebt.party}</span>
                .
              </p>
              <p>
                المبلغ المتبقي:
                <span className="font-bold text-destructive">
                  {' '}
                  {selectedDebt.amount.toFixed(2)} د.ك
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

function WorkersView() {
 const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [newWorker, setNewWorker] = useState({
    name: '',
    salary: '',
  });

  const handleAddWorker = () => {
    const { name, salary } = newWorker;
    if (!name || !salary) return;

    const newId = `worker-${Date.now()}`;

    setWorkers([
      ...workers,
      {
        id: newId,
        name,
        salary: `${salary} د.ك`,
      },
    ]);
    setNewWorker({ name: '', salary: '' });
  };

  const handleDeleteWorker = (id: string) => {
    setWorkers(workers.filter((worker) => worker.id !== id));
  };

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold text-foreground sr-only">العمال</h1>
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
          <Button onClick={handleAddWorker} className="mt-4">
            <Plus className="h-4 w-4 ml-2" />
            إضافة العامل
          </Button>
        </CardContent>
      </Card>

      <div className="bg-card p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4">قائمة العمال</h2>
        {workers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>راتب العامل</TableHead>
                <TableHead className="text-left">حذف</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.map((worker) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium flex items-center">
                    <div className="p-2 rounded-lg border bg-secondary/30 mr-3 rtl:mr-0 rtl:ml-3">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    {worker.name}
                  </TableCell>
                  <TableCell>{worker.salary}</TableCell>
                  <TableCell className="text-left">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteWorker(worker.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            لا يوجد عمال لعرضهم.
          </p>
        )}
      </div>
    </div>
  );
}

export default function ManagementView() {
  const [activeTab, setActiveTab] = useState('expenses');

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
          <TabsTrigger value="expenses">
            <DollarSign className="h-4 w-4 ml-2" />
            المصاريف
          </TabsTrigger>
          <TabsTrigger value="sales">
            <ShoppingCart className="h-4 w-4 ml-2" />
            المبيعات
          </TabsTrigger>
          <TabsTrigger value="debts">
            <HandCoins className="h-4 w-4 ml-2" />
            الديون
          </TabsTrigger>
          <TabsTrigger value="workers">
            <User className="h-4 w-4 ml-2" />
            العمال
          </TabsTrigger>
        </TabsList>
        <TabsContent value="expenses" className="mt-6">
          <ExpensesView />
        </TabsContent>
        <TabsContent value="sales" className="mt-6">
          <SalesView />
        </TabsContent>
        <TabsContent value="debts" className="mt-6">
          <DebtsView />
        </TabsContent>
        <TabsContent value="workers" className="mt-6">
          <WorkersView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
