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
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      ...sales,
      { id: newId, date: newDate, ...newSale, amount: `${newSale.amount} د.ك` },
    ]);
    setNewSale({ item: '', customer: '', amount: '' });
    setIsDialogOpen(false);
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
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                إضافة بيع جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>إضافة بيع جديد</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="item" className="text-right">
                    المنتج
                  </Label>
                  <Input
                    id="item"
                    value={newSale.item}
                    onChange={(e) =>
                      setNewSale({ ...newSale, item: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="customer" className="text-right">
                    العميل
                  </Label>
                  <Input
                    id="customer"
                    value={newSale.customer}
                    onChange={(e) =>
                      setNewSale({ ...newSale, customer: e.target.value })
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
                    value={newSale.amount}
                    onChange={(e) =>
                      setNewSale({ ...newSale, amount: e.target.value })
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
                <Button onClick={handleAddSale}>حفظ</Button>
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
