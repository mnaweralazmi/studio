"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import NextLink from "next/link"

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

const addTaskFormSchema = z.object({
  taskType: z.enum(["رش", "ري", "زراعة", "تسميد"], {
    required_error: "الرجاء اختيار نوع المهمة.",
  }),
  title: z.string().min(3, "يجب أن يكون العنوان 3 أحرف على الأقل.").max(50, "يجب أن يكون العنوان 50 حرفًا على الأكثر."),
  description: z.string().optional(),
})

export default function AddTaskPage() {
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof addTaskFormSchema>>({
    resolver: zodResolver(addTaskFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  function onSubmit(data: z.infer<typeof addTaskFormSchema>) {
    console.log(data)
    toast({
      title: "تمت إضافة المهمة بنجاح!",
      description: `تم إنشاء مهمة "${data.title}" من نوع "${data.taskType}".`,
    })
    router.push("/calendar")
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
              املأ النموذج أدناه لإضافة مهمة جديدة إلى تقويمك.
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
                          <SelectItem value="رش">رش</SelectItem>
                          <SelectItem value="ري">ري</SelectItem>
                          <SelectItem value="زراعة">زراعة</SelectItem>
                          <SelectItem value="تسميد">تسميد</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
