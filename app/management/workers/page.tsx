'use client';

import { useState } from 'react';
import { ArrowRight, Plus, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Worker = {
  id: string;
  name: string;
  role: string;
  phone: string;
};

const initialWorkers: Worker[] = [
  {
    id: '1',
    name: 'أحمد عبدالله',
    role: 'مشرف زراعي',
    phone: '91234567',
  },
  {
    id: '2',
    name: 'محمد حسين',
    role: 'عامل ري',
    phone: '98765432',
  },
  {
    id: '3',
    name: 'علي كريم',
    role: 'عامل حصاد',
    phone: '99887766',
  },
];

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [newWorker, setNewWorker] = useState({
    name: '',
    role: '',
    phone: '',
  });

  const handleAddWorker = () => {
    const { name, role, phone } = newWorker;
    if (!name || !role || !phone) return;

    const newId = (workers.length + 1 + Math.random()).toString();

    setWorkers([
      ...workers,
      {
        id: newId,
        name,
        role,
        phone,
      },
    ]);
    setNewWorker({ name: '', role: '', phone: '' });
  };

  const handleDeleteWorker = (id: string) => {
    setWorkers(workers.filter((worker) => worker.id !== id));
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">العمال</h1>
          <p className="mt-1 text-muted-foreground">
            إدارة قائمة العمال في المزرعة.
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
          <CardTitle>إضافة عامل جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="role">الوظيفة</Label>
              <Input
                id="role"
                placeholder="مثال: مشرف زراعي"
                value={newWorker.role}
                onChange={(e) =>
                  setNewWorker({ ...newWorker, role: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="مثال: 91234567"
                value={newWorker.phone}
                onChange={(e) =>
                  setNewWorker({ ...newWorker, phone: e.target.value })
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>الوظيفة</TableHead>
              <TableHead>رقم الهاتف</TableHead>
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
                <TableCell>{worker.role}</TableCell>
                <TableCell dir="ltr">{worker.phone}</TableCell>
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
      </div>
    </div>
  );
}
