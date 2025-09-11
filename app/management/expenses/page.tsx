'use client';

import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Expense = {
  id: string;
  date: string;
  item: string;
  category: string;
  amount: string;
};

const initialExpenses: Expense[] = [
  {
    id: '1',
    date: '٢٠٢٤/٠٧/٢٠',
    item: 'شراء بذور طماطم',
    category: 'مستلزمات زراعية',
    amount: '١٥٠ د.ك',
  },
  {
    id: '2',
    date: '٢٠٢٤/٠٧/١٩',
    item: 'وقود للمضخة',
    category: 'تشغيل',
    amount: '٣٠ د.ك',
  },
  {
    id: '3',
    date: '٢٠٢٤/٠٧/١٨',
    item: 'أسمدة عضوية',
    category: 'مستلزمات زراعية',
    amount: '٢٥٠ د.ك',
  },
  {
    id: '4',
    date: '٢٠٢٤/٠٧/١٧',
    item: 'صيانة السياج',
    category: 'صيانة',
    amount: '٧٥ د.ك',
  },
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [newExpense, setNewExpense] = useState({
    item: '',
    category: '',
    amount: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddExpense = () => {
    if (!newExpense.item || !newExpense.amount) return;
    const newId = (expenses.length + 1).toString();
    const today = new Date();
    const newDate = new Intl.DateTimeFormat('ar-KW-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(today);

    setExpenses([
      ...expenses,
      { id: newId, date: newDate, ...newExpense, amount: `${newExpense.amount} د.ك` },
    ]);
    setNewExpense({ item: '', category: '', amount: '' });
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المصاريف</h1>
          <p className="mt-1 text-muted-foreground">
            تتبع جميع نفقات المزرعة.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة مصروف جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>إضافة مصروف جديد</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="item" className="text-right">
                    البند
                  </Label>
                  <Input
                    id="item"
                    value={newExpense.item}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, item: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    الفئة
                  </Label>
                  <Input
                    id="category"
                    value={newExpense.category}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, category: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    المبلغ
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, amount: e.target.value })
                    }
                    className="col-span-3"
                    dir="ltr"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">إلغاء</Button>
                </DialogClose>
                <Button onClick={handleAddExpense}>حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button asChild variant="outline">
            <Link href="/management">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Link>
          </Button>
        </div>
      </header>
      <div className="bg-card p-6 rounded-xl shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>البند</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead className="text-left">المبلغ</TableHead>
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
                <TableCell className="text-left font-semibold text-destructive">
                  {expense.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
