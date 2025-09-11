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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Sale = {
  id: string;
  date: string;
  item: string;
  customer: string;
  amount: string;
};

const initialSales: Sale[] = [
  {
    id: '1',
    date: '٢٠٢٤/٠٧/٢١',
    item: 'بيع محصول الخيار (صندوق)',
    customer: 'سوق محلي',
    amount: '٣٥٠ د.ك',
  },
  {
    id: '2',
    date: '٢٠٢٤/٠٧/٢٠',
    item: 'بيع تمر سكري (كيلو)',
    customer: 'عميل خاص',
    amount: '٨٠ د.ك',
  },
  {
    id: '3',
    date: '٢٠٢٤/٠٧/١٩',
    item: 'بيع نعناع (حزمة)',
    customer: 'مطعم',
    amount: '٤٥ د.ك',
  },
];

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [newSale, setNewSale] = useState({
    item: '',
    customer: '',
    amount: '',
  });

  const handleAddSale = () => {
    if (!newSale.item || !newSale.amount || !newSale.customer) return;
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
    setNewSale({ item: '', customer: '', amount: '' });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item">المنتج</Label>
              <Input
                id="item"
                placeholder="مثال: خيار (صندوق)"
                value={newSale.item}
                onChange={(e) =>
                  setNewSale({ ...newSale, item: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">العميل</Label>
              <Input
                id="customer"
                placeholder="مثال: سوق محلي"
                value={newSale.customer}
                onChange={(e) =>
                  setNewSale({ ...newSale, customer: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">المبلغ</Label>
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
              <TableHead>العميل</TableHead>
              <TableHead className="text-left">المبلغ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.date}</TableCell>
                <TableCell className="font-medium">{sale.item}</TableCell>
                <TableCell>
                  <Badge variant="outline">{sale.customer}</Badge>
                </TableCell>
                <TableCell className="text-left font-semibold text-green-600">
                  {sale.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
