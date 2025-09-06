
export type WorkerFormValues = {
  name: string;
  baseSalary: number;
};

export interface Transaction {
    id: string;
    type: 'salary' | 'bonus' | 'deduction';
    amount: number;
    date: string; // Keep as string (ISO format) for consistency
    description: string;
    month?: number;
    year?: number;
}

export interface Worker extends WorkerFormValues {
  id: string;
  paidMonths: { year: number; month: number }[];
  transactions: Transaction[];
  ownerId: string;
}


export type TransactionFormValues = {
  type: 'bonus' | 'deduction';
  amount: number;
  description: string;
};
