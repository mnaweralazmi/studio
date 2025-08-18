
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Landmark, Trash2, PlusCircle, CalendarIcon, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { useLanguage } from '@/context/language-context';
import { DebtsContent } from '@/components/debts-content';

export default function DebtsPage() {
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl mx-auto flex flex-col gap-8">
        <DebtsContent />
      </div>
    </main>
  );
}
