
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { User, Save } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileFormSchema = z.object({
    name: z.string().min(3, "يجب أن يتكون الاسم من 3 أحرف على الأقل."),
    username: z.string(),
    email: z.string().email("البريد الإلكتروني غير صالح."),
    password: z.string().min(6, "يجب أن تكون كلمة المرور 6 أحرف على الأقل.").optional().or(z.literal('')),
    confirmPassword: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().url("الرجاء إدخال رابط صورة صالح.").optional().or(z.literal('')),
}).refine(data => {
    if (data.password) {
        return data.password === data.confirmPassword;
    }
    return true;
}, {
    message: "كلمتا المرور غير متطابقتين.",
    path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
    const { toast } = useToast();
    const [user, setUser] = React.useState<any>(null);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            name: "",
            username: "",
            email: "",
            bio: "",
            avatarUrl: "",
            password: "",
            confirmPassword: "",
        },
    });

    React.useEffect(() => {
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr);
            const allUsersStr = localStorage.getItem('users');
            const allUsers = allUsersStr ? JSON.parse(allUsersStr) : [];
            
            let currentUserDetails = allUsers.find((u: any) => u.username === storedUser.username);
            
            // Fallback to admin user if not found in users array
            if (!currentUserDetails && storedUser.username === 'mnawer1988') {
                 currentUserDetails = { username: 'mnawer1988', password: 'mnawer1988', role: 'admin', name: 'المدير العام', email: 'admin@example.com', bio: 'أنا مدير هذا الموقع.', avatarUrl: '' };
            }


            if (currentUserDetails) {
                 setUser(currentUserDetails);
                 form.reset({
                    name: currentUserDetails.name || '',
                    username: currentUserDetails.username || '',
                    email: currentUserDetails.email || '',
                    bio: currentUserDetails.bio || '',
                    avatarUrl: currentUserDetails.avatarUrl || '',
                    password: '',
                    confirmPassword: '',
                });
            }
        }
    }, [form]);
    
    const avatarUrl = form.watch('avatarUrl');

    function onSubmit(data: ProfileFormValues) {
        try {
            const allUsersStr = localStorage.getItem('users');
            let allUsers = allUsersStr ? JSON.parse(allUsersStr) : [];
            let isUserInArray = true;
            
            let userIndex = allUsers.findIndex((u: any) => u.username === user.username);
            
            // Handle admin user separately if not in the main array
            if (userIndex === -1 && user.username === 'mnawer1988') {
                isUserInArray = false;
            }

            const updatedUser = {
                ...user,
                name: data.name,
                email: data.email,
                bio: data.bio,
                avatarUrl: data.avatarUrl,
                ...(data.password && { password: data.password }),
            };
            
            if (isUserInArray) {
                 allUsers[userIndex] = updatedUser;
            } else if (user.username === 'mnawer1988') {
                // Admin data might not be in the 'users' array, so we don't save it there
                // But we update the 'user' object in localStorage
            }

            localStorage.setItem('users', JSON.stringify(allUsers));
            localStorage.setItem('user', JSON.stringify({
                username: updatedUser.username,
                name: updatedUser.name,
                role: updatedUser.role
            }));
            
            setUser(updatedUser);

            toast({
                title: "تم تحديث الملف الشخصي!",
                description: "تم حفظ بياناتك الجديدة بنجاح.",
            });
            form.reset({
                ...form.getValues(),
                password: '',
                confirmPassword: '',
            });

        } catch (error) {
             toast({
                variant: "destructive",
                title: "خطأ!",
                description: "لم نتمكن من تحديث ملفك الشخصي.",
            });
        }
    }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
          <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User />
                            ملف المستخدم
                        </CardTitle>
                        <CardDescription>
                            هنا يمكنك عرض وتعديل بيانات ملفك الشخصي.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex items-center gap-6">
                             <Avatar className="h-24 w-24">
                                <AvatarImage src={avatarUrl || 'https://placehold.co/100x100.png'} alt={user?.name} data-ai-hint="user avatar" />
                                <AvatarFallback>{user?.name?.[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <FormField
                                    control={form.control}
                                    name="avatarUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>رابط الصورة الرمزية</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://example.com/avatar.png" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>الاسم الكامل</FormLabel>
                                    <FormControl>
                                        <Input placeholder="أدخل اسمك الكامل" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>اسم المستخدم (لا يمكن تغييره)</FormLabel>
                                    <FormControl>
                                        <Input readOnly disabled {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>البريد الإلكتروني</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="user@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                         <div>
                            <h3 className="text-lg font-medium mb-4">تغيير كلمة المرور</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>كلمة المرور الجديدة</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="اتركها فارغة لعدم التغيير" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>تأكيد كلمة المرور الجديدة</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>الملف التعريفي</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="نبذة مختصرة عنك..." {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />

                    </CardContent>
                    <CardFooter className="border-t pt-6 flex justify-end">
                        <Button type="submit">
                            <Save className="ml-2 h-4 w-4" />
                            حفظ التغييرات
                        </Button>
                    </CardFooter>
                </form>
            </Form>
          </Card>
      </div>
    </main>
  );
}
