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

export default function SalesPage() {
  const sales = [
    {
      id: "1",
      date: "٢٠٢٤/٠٧/٢١",
      item: "بيع محصول الخيار (صندوق)",
      customer: "سوق محلي",
      amount: "٣٥٠ د.ك",
    },
    {
      id: "2",
      date: "٢٠٢٤/٠٧/٢٠",
      item: "بيع تمر سكري (كيلو)",
      customer: "عميل خاص",
      amount: "٨٠ د.ك",
    },
    {
      id: "3",
      date: "٢٠٢٤/٠٧/١٩",
      item: "بيع نعناع (حزمة)",
      customer: "مطعم",
      amount: "٤٥ د.ك",
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">المبيعات</h1>
          <p className="mt-1 text-muted-foreground">
            سجل إيرادات المزرعة من المحاصيل.
          </p>
        </div>
        <Button asChild>
          <Link href="/management">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة
          </Link>
        </Button>
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
