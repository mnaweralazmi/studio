'use client';

import { useState } from 'react';
import {
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle,
  CreditCard,
} from 'lucide-react';
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
} from '@/components/ui/dialog';

type Debt = {
  id: string;
  party: string;
  dueDate: string;
  amount: number;
  type: 'دين لنا' | 'دين علينا';
};

const initialDebts: Debt[] = [
  {
    id: '1',
    party: "مورد الأسمدة 'نمو'",
    dueDate: '٢٠٢٤/٠٨/٠١',
    amount: 400,
    type: 'دين علينا',
  },
  {
    id: '2',
    party: "مطعم 'حصاد اليوم'",
    dueDate: '٢٠٢٤/٠٧/٢٥',
    amount: 120,
    type: 'دين لنا',
  },
];

export default function DebtsPage() {
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

    const newId = (debts.length + 1 + Math.random()).toString();
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
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الديون</h1>
          <p className="mt-1 text-muted-foreground">
            إدارة الديون المستحقة للمزرعة وعليها.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/management">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة
          </Link>
        </Button>
      </header>

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
