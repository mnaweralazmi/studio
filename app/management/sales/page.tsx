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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Sale = {
  id: string;
  date: string;
  item: string;
  cartonCount: string;
  cartonWeight: string;
  amount: string;
};

const initialSales: Sale[] = [
  {
    id: '1',
    date: '٢٠٢٤/٠٧/٢١',
    item: 'خيار',
    cartonCount: '50',
    cartonWeight: '10 كيلو',
    amount: '٣٥٠ د.ك',
  },
  {
    id: '2',
    date: '٢٠٢٤/٠٧/٢٠',
    item: 'طماطم',
    cartonCount: '30',
    cartonWeight: '12 كيلو',
    amount: '٢٨٠ د.ك',
  },
  {
    id: '3',
    date: '٢٠٢٤/٠٧/١٩',
    item: 'بطاطس',
    cartonCount: '100',
    cartonWeight: '15 كيلو',
    amount: '٤٥٠ د.ك',
  },
];

const vegetableOptions = ['طماطم', 'خيار', 'بطاطس', 'باذنجان', 'فلفل', 'كوسا'];

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [newSale, setNewSale] = useState({
    item: '',
    cartonCount: '',
    cartonWeight: '',
    amount: '',
  });

  const handleAddSale = () => {
    if (!newSale.item || !newSale.cartonCount || !newSale.cartonWeight || !newSale.amount) return;
    const newId = (sales.length + 1).toString();
    const today = new Date();
    const newDate = new Intl.DateTimeFormat('ar-KW-u-nu-latn', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(today);

    setSales([
      { id: newId, date: newDate, ...newSale, amount: `${newSale.amount} د.ك` },
      ...sales,
    ]);
    setNewSale({ item: '', cartonCount: '', cartonWeight: '', amount: '' });
  };
  
  const handleDeleteSale = (id: string) => {
    setSales(sales.filter((sale) => sale.id !== id));
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المبيعات</h1>
          <p className="mt-1 text-muted-foreground">
            سجل إيرادات المزرعة من المحاصيل.
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
              <Label htmlFor="amount">المبلغ الإجمالي</Label>
              <Input
                id="amount"
                type="number"
                placeholder="بالدينار الكويتي"
                value={newSale.amount}
                onChange={(e) =>
                  setNewSale({ ...newSale, amount: e.target.value })
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ</TableHead>
              <TableHead>المنتج</TableHead>
              <TableHead>عدد الكراتين</TableHead>
              <TableHead>وزن الكرتون</TableHead>
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
                <TableCell className="font-semibold text-green-600">
                  {sale.amount}
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
      </div>
    </div>
  );
}
