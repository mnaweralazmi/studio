
import { z } from 'zod';

const workerFormSchema = z.object({
  name: z.string().min(3, "اسم العامل يجب أن يكون 3 أحرف على الأقل."),
  baseSalary: z.coerce.number().min(0, "الراتب الأساسي يجب أن يكون رقمًا إيجابيًا."),
});

export type WorkerFormValues = z.infer<typeof workerFormSchema>;

export interface Transaction {
    id: string;
    type: 'salary' | 'bonus' | 'deduction';
    amount: number;
    date: string;
    description: string;
    month?: number;
    year?: number;
}

export interface Worker extends WorkerFormValues {
  id: string;
  paidMonths: { year: number; month: number }[];
  transactions: Transaction[];
}

const transactionFormSchema = z.object({
  type: z.enum(['bonus', 'deduction']),
  amount: z.coerce.number().min(0.01, "المبلغ يجب أن يكون إيجابياً."),
  description: z.string().min(3, "الوصف مطلوب."),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
