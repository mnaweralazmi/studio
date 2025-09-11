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

export default function DebtsPage() {
  const debts = [
    {
      id: "1",
      party: "مورد الأسمدة 'نمو'",
      dueDate: "٢٠٢٤/٠٨/٠١",
      amount: "٤٠٠ د.ك",
      type: "دين علينا",
    },
    {
      id: "2",
      party: "مطعم 'حصاد اليوم'",
      dueDate: "٢٠٢٤/٠٧/٢٥",
      amount: "١٢٠ د.ك",
      type: "دين لنا",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">الديون</h1>
          <p className="mt-1 text-muted-foreground">
            إدارة الديون المستحقة للمزرعة وعليها.
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
              <TableHead>الجهة</TableHead>
              <TableHead>تاريخ الاستحقاق</TableHead>
              <TableHead>نوع الدين</TableHead>
              <TableHead className="text-left">المبلغ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {debts.map((debt) => (
              <TableRow key={debt.id}>
                <TableCell className="font-medium">{debt.party}</TableCell>
                <TableCell>{debt.dueDate}</TableCell>
                <TableCell>
                  <Badge
                    variant={debt.type === "دين لنا" ? "default" : "destructive"}
                  >
                    {debt.type}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-left font-semibold ${
                    debt.type === "دين لنا" ? "text-green-600" : "text-destructive"
                  }`}
                >
                  {debt.amount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
