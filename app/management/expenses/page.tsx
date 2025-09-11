import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ExpensesPage() {
  const expenses = [
    {
      id: "1",
      date: "٢٠٢٤/٠٧/٢٠",
      item: "شراء بذور طماطم",
      category: "مستلزمات زراعية",
      amount: "١٥٠ د.ك",
    },
    {
      id: "2",
      date: "٢٠٢٤/٠٧/١٩",
      item: "وقود للمضخة",
      category: "تشغيل",
      amount: "٣٠ د.ك",
    },
    {
      id: "3",
      date: "٢٠٢٤/٠٧/١٨",
      item: "أسمدة عضوية",
      category: "مستلزمات زراعية",
      amount: "٢٥٠ د.ك",
    },
    {
      id: "4",
      date: "٢٠٢٤/٠٧/١٧",
      item: "صيانة السياج",
      category: "صيانة",
      amount: "٧٥ د.ك",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المصاريف</h1>
          <p className="mt-1 text-muted-foreground">
            تتبع جميع نفقات المزرعة.
          </p>
        </div>
        <Button asChild>
          <Link href="/management">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة لإدارة المزرعة
          </Link>
        </Button>
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
