
"use client";

import * as React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Leaf, LogIn, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const loginFormSchema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب."),
  password: z.string().min(1, "كلمة المرور مطلوبة."),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        const storedUsers = localStorage.getItem('users');
        const users = storedUsers ? JSON.parse(storedUsers) : [];
        const adminUser = { username: 'mnawer1988', password: 'mnawer1988', role: 'admin', name: 'المدير العام' };

        let foundUser;
        if (data.username === adminUser.username && data.password === adminUser.password) {
            foundUser = adminUser;
        } else {
            foundUser = users.find((u: any) => u.username === data.username && u.password === data.password);
        }

      if (foundUser) {
        const userToSave = {
            username: foundUser.username,
            role: foundUser.role || 'user',
            name: foundUser.name || foundUser.username
        };
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(userToSave));
        
        toast({
          title: "تم تسجيل الدخول بنجاح!",
          description: `أهلاً بك، ${userToSave.name}.`,
        });
        router.push('/');
      } else {
        toast({
          variant: "destructive",
          title: "فشل تسجيل الدخول",
          description: "اسم المستخدم أو كلمة المرور غير صحيحة.",
        });
      }
      setIsLoading(false);
    }, 1000);
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen p-4 bg-background">
       <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-3 bg-primary/20 px-4 py-2 rounded-full mb-6">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-semibold text-primary-foreground">مزارع كويتي</span>
        </div>
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                    <LogIn />
                    تسجيل الدخول
                </CardTitle>
                <CardDescription>
                    أدخل بياناتك للوصول إلى حسابك.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>اسم المستخدم</FormLabel>
                                <FormControl>
                                    <Input placeholder="" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>كلمة المرور</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input 
                                            type={showPassword ? "text" : "password"} 
                                            placeholder="" 
                                            {...field}
                                            className="pr-10" 
                                        />
                                    </FormControl>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground">
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "جاري التحقق..." : "تسجيل الدخول"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Separator />
                <p className="text-sm text-muted-foreground">
                    ليس لديك حساب؟{' '}
                    <NextLink href="/register" className="font-semibold text-primary hover:underline">
                        إنشاء حساب جديد
                    </NextLink>
                </p>
            </CardFooter>
        </Card>
      </div>
    </main>
  );
}
