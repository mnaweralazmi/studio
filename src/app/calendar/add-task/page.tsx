
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import NextLink from "next/link"
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import React from "react"

const taskTypes = ["رش", "ري", "زراعة", "تسميد"] as const;
const vegetableList = [
  "طماطم", "خيار", "بطاطس", "بصل", "جزر", "فلفل رومي", "باذنجان", "كوسا", "خس", "بروكلي", "سبانخ", "قرنبيط", "بامية", "فاصوليا خضراء", "بازلاء"
] as const;
const fruitList = [
  "تفاح", "موز", "برتقال", "مانجو", "عنب", "فراولة", "بطيخ", "تين", "رمان", "توت", "كرز", "مشمش"
] as const;

const addTaskFormSchema = z.object({
  taskType: z.string({ required_error: "الرجاء اختيار نوع المهمة." }),
  newTaskTypeName: z.string().optional(),
  title: z.string().min(3, "يجب أن يكون العنوان 3 أحرف على الأقل.").max(50, "يجب أن يكون العنوان 50 حرفًا على الأكثر."),
  description: z.string().optional(),
  vegetable: z.string().optional(),
  fruit: z.string().optional(),
}).refine(data => {
    if (data.taskType === 'add_new_task') {
        return !!data.newTaskTypeName && data.newTaskTypeName.length >= 2;
    }
    return true;
}, {
    message: "الرجاء إدخال اسم نوع المهمة الجديد (حرفين على الأقل).",
    path: ['newTaskTypeName'],
});

export default function AddTaskPage() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const { toast } = useToast()
  
  const dateStr = searchParams.get('date');
  const selectedDate = dateStr ? new Date(dateStr) : new Date();

  const form = useForm<z.infer<typeof addTaskFormSchema>>({
    resolver: zodResolver(addTaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      vegetable: "",
      fruit: "",
      newTaskTypeName: ""
    },
  })

  const selectedTaskType = form.watch("taskType");

  function onSubmit(data: z.infer<typeof addTaskFormSchema>) {
    let finalTaskType = data.taskType;
    if (data.taskType === 'add_new_task' && data.newTaskTypeName) {
        finalTaskType = data.newTaskTypeName;
    }
    
    toast({
      title: "تمت إضافة المهمة بنجاح!",
      description: `تم إنشاء مهمة "${data.title}" من نوع "${finalTaskType}".`,
    })
    
    const params = new URLSearchParams();
    params.set('title', data.title);
    params.set('taskType', finalTaskType);
    if (data.description) {
      params.set('description', data.description);
    }
    if (data.vegetable) {
      params.set('vegetable', data.vegetable);
    }
    if (data.fruit) {
      params.set('fruit', data.fruit);
    }
    params.set('date', selectedDate.toISOString());
    
    router.push(`/calendar?${params.toString()}`);
  }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle />
              إضافة مهمة جديدة
            </CardTitle>
            <CardDescription>
              أنت تضيف مهمة للتاريخ: {format(selectedDate, "PPP", { locale: arSA })}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="taskType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المهمة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع المهمة..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {taskTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                          <SelectItem value="add_new_task">إضافة نوع جديد...</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedTaskType === 'add_new_task' && (
                  <FormField
                    control={form.control}
                    name="newTaskTypeName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم نوع المهمة الجديد</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: حصاد، تقليم" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان المهمة</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: ري نبات الصبار" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="vegetable"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>الخضروات (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر نوع الخضار..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="">لا يوجد</SelectItem>
                                {vegetableList.map(veg => (
                                <SelectItem key={veg} value={veg}>{veg}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="fruit"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>الفواكه (اختياري)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر نوع الفاكهة..." />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="">لا يوجد</SelectItem>
                                {fruitList.map(fruit => (
                                <SelectItem key={fruit} value={fruit}>{fruit}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف (اختياري)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أضف تفاصيل إضافية هنا..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                   <Button type="button" variant="outline" asChild>
                     <NextLink href="/calendar">إلغاء</NextLink>
                  </Button>
                  <Button type="submit">إضافة المهمة</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
