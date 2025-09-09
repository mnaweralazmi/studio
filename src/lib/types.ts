
import type { Timestamp } from "firebase/firestore";

// Base type for all data items, ensuring they have an ID and owner.
export interface BaseItem {
    id: string;
    ownerId: string;
}

// ========== DEPARTMENTS ==========
export type Department = 'agriculture' | 'livestock' | 'poultry' | 'fish';


// ========== CALENDAR & TASKS ==========
export interface Task extends BaseItem {
  title: string;
  description?: string;
  dueDate: Date; 
  isCompleted: boolean;
  isRecurring: boolean;
  reminderDays?: number;
}
export type TaskData = Omit<Task, 'id'>;

export interface ArchivedTask extends Task {
    completedAt: Date;
}


// ========== FINANCIALS - SALES ==========
export interface SalesItem extends BaseItem {
  product: string;
  quantity: number;
  weightPerUnit?: number;
  price: number;
  total: number;
  date: Date;
  departmentId: Department;
}
export type SalesItemData = Omit<SalesItem, 'id'>;

export interface ArchivedSale extends SalesItem {
    archivedAt: Date;
}


// ========== FINANCIALS - EXPENSES ==========
export interface ExpenseItem extends BaseItem {
  date: Date;
  type: 'fixed' | 'variable';
  category: string;
  item: string;
  amount: number;
  departmentId: Department;
}
export type ExpenseItemData = Omit<ExpenseItem, 'id'>;

export interface ArchivedExpense extends ExpenseItem {
    archivedAt: Date;
}


// ========== FINANCIALS - DEBTS ==========
export interface Payment {
  id?: string; // Can be optional if not stored as a separate document
  amount: number;
  date: Date;
}

export interface DebtItem extends BaseItem {
  creditor: string;
  amount: number;
  dueDate?: Date | null; // Allow null for optional dates
  status: 'unpaid' | 'paid' | 'partially-paid';
  payments: Payment[];
  departmentId: Department;
}
export type DebtItemData = Omit<DebtItem, 'id' | 'payments' | 'status'>;

export interface ArchivedDebt extends Omit<DebtItem, 'id' | 'ownerId'> {
    id: string;
    ownerId: string;
    archivedAt: Date;
}


// ========== FINANCIALS - WORKERS ==========
export interface Transaction {
    id: string;
    type: 'salary' | 'bonus' | 'deduction';
    amount: number;
    date: Date;
    description: string;
    month?: number;
    year?: number;
}
export type TransactionFormValues = Omit<Transaction, 'id' | 'date' | 'month' | 'year'>;

export interface PaidMonth {
    year: number;
    month: number;
}

export interface Worker extends BaseItem {
  name: string;
  baseSalary: number;
  paidMonths: PaidMonth[];
  transactions: Transaction[];
  departmentId: Department;
}
export type WorkerFormValues = Pick<Worker, 'name' | 'baseSalary'>;


// ========== TOPICS & CONTENT ==========
export interface VideoSection {
  id: string;
  titleKey: string;
  title?: string;
  durationKey: string;
  duration?: string;
  image: string;
  videoUrl: string;
  hint?: string;
}

export interface SubTopic {
    id: string;
    titleKey: string;
    title?: string;
    descriptionKey: string;
    description?: string;
    image: string;
    hint?: string;
}
  
export interface AgriculturalSection {
    id: string;
    titleKey: string;
    title?: string;
    descriptionKey: string;
    description?: string;
    iconName: string;
    image: string;
    hint?: string;
    subTopics: SubTopic[];
    videos: VideoSection[];
    ownerId?: string; // Make ownerId optional for public data
}
