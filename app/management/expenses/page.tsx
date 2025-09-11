'use client';

import { useState } from 'react';
import { ArrowRight, Plus, Trash2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المصاريف</h1>
          <p className="mt-1 text-muted-foreground">
            تتبع جميع نفقات المزرعة.
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
      </div>
    </div>
  );
}
