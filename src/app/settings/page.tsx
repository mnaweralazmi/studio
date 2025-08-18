
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
import { User, Save, Palette, Bell, Languages } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useLanguage, Language } from '@/context/language-context';

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

type Theme = "theme-green" | "theme-blue" | "theme-orange";
type Mode = "light" | "dark";

export default function SettingsPage() {
    const { toast } = useToast();
    const [user, setUser] = React.useState<any>(null);
    const [theme, setTheme] = React.useState<Theme>('theme-green');
    const [mode, setMode] = React.useState<Mode>('dark');
    const { language, setLanguage, t } = useLanguage();

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: { name: "", username: "", email: "", bio: "", avatarUrl: "", password: "", confirmPassword: "" },
    });

    React.useEffect(() => {
        // Load user data
        const storedUserStr = localStorage.getItem('user');
        if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr);
            const allUsersStr = localStorage.getItem('users');
            const allUsers = allUsersStr ? JSON.parse(allUsersStr) : [];
            let currentUserDetails = allUsers.find((u: any) => u.username === storedUser.username);
            
            if (!currentUserDetails && storedUser.username === 'mnawer1988') {
                 currentUserDetails = { username: 'mnawer1988', password: 'mnawer1988', role: 'admin', name: 'المدير العام', email: 'admin@example.com', bio: 'أنا مدير هذا الموقع.', avatarUrl: '' };
            }

            if (currentUserDetails) {
                 setUser(currentUserDetails);
                 profileForm.reset({
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
        
        // Load theme and mode
        const savedTheme = localStorage.getItem('theme') as Theme || 'theme-green';
        const savedMode = localStorage.getItem('mode') as Mode || 'dark';
        
        setTheme(savedTheme);
        setMode(savedMode);

        document.body.classList.remove('theme-green', 'theme-blue', 'theme-orange');
        document.body.classList.add(savedTheme);
        
        const html = document.documentElement;
        html.classList.remove('light', 'dark');
        html.classList.add(savedMode);

    }, [profileForm]);
    
    const avatarUrl = profileForm.watch('avatarUrl');

    function onProfileSubmit(data: ProfileFormValues) {
        try {
            const allUsersStr = localStorage.getItem('users');
            let allUsers = allUsersStr ? JSON.parse(allUsersStr) : [];
            let userIndex = allUsers.findIndex((u: any) => u.username === user.username);
            
            const updatedUser = { ...user, name: data.name, email: data.email, bio: data.bio, avatarUrl: data.avatarUrl, ...(data.password && { password: data.password }) };
            
            if (userIndex !== -1) {
                 allUsers[userIndex] = updatedUser;
            }
            
            localStorage.setItem('users', JSON.stringify(allUsers));
            localStorage.setItem('user', JSON.stringify({ username: updatedUser.username, name: updatedUser.name, role: updatedUser.role }));
            setUser(updatedUser);
            toast({ title: t('profileUpdated'), description: t('profileUpdatedSuccess') });
            profileForm.reset({ ...profileForm.getValues(), password: '', confirmPassword: '' });
        } catch (error) {
             toast({ variant: "destructive", title: t('error'), description: t('profileUpdateFailed') });
        }
    }

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        document.body.classList.remove('theme-green', 'theme-blue', 'theme-orange');
        document.body.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
        toast({ title: t('themeChanged') });
    };

    const handleModeChange = (newMode: Mode) => {
        setMode(newMode);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newMode);
        localStorage.setItem('mode', newMode);
        toast({ title: newMode === 'dark' ? t('darkModeActivated') : t('lightModeActivated') });
    };

    const handleLanguageChange = (newLang: Language) => {
        setLanguage(newLang);
        toast({ title: t('languageChanged'), description: t('languageChangedSuccess') });
    }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
          <Card>
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"> <User /> {t('userProfile')} </CardTitle>
                        <CardDescription> {t('userProfileDesc')} </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="flex items-center gap-6">
                             <Avatar className="h-24 w-24">
                                <AvatarImage src={avatarUrl || 'https://placehold.co/100x100.png'} alt={user?.name} data-ai-hint="user avatar" />
                                <AvatarFallback>{user?.name?.[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <FormField control={profileForm.control} name="avatarUrl" render={({ field }) => ( <FormItem><FormLabel>{t('avatarUrl')}</FormLabel><FormControl><Input placeholder="https://example.com/avatar.png" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={profileForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{t('fullName')}</FormLabel><FormControl><Input placeholder={t('enterFullName')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                             <FormField control={profileForm.control} name="username" render={({ field }) => ( <FormItem><FormLabel>{t('username')} ({t('cannotChange')})</FormLabel><FormControl><Input readOnly disabled {...field} /></FormControl><FormMessage /></FormItem> )} />
                             <FormField control={profileForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>{t('email')}</FormLabel><FormControl><Input type="email" placeholder="user@example.com" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                         <div>
                            <h3 className="text-lg font-medium mb-4">{t('changePassword')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={profileForm.control} name="password" render={({ field }) => ( <FormItem><FormLabel>{t('newPassword')}</FormLabel><FormControl><Input type="password" placeholder={t('leaveBlank')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={profileForm.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>{t('confirmNewPassword')}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                        </div>
                        <FormField control={profileForm.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>{t('bio')}</FormLabel><FormControl><Textarea placeholder={t('bioPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </CardContent>
                    <CardFooter className="border-t pt-6 flex justify-end">
                        <Button type="submit"> <Save className={language === 'ar' ? 'mr-2' : 'ml-2'} /> {t('saveChanges')} </Button>
                    </CardFooter>
                </form>
            </Form>
          </Card>
          
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette /> {t('displayAndLanguage')}</CardTitle>
                <CardDescription>{t('displayAndLanguageDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                   <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Languages /> {t('language')}</Label>
                      <Select value={language} onValueChange={(value: Language) => handleLanguageChange(value)}>
                          <SelectTrigger>
                              <SelectValue placeholder={t('selectLanguage')} />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="ar">العربية</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  
                   <Separator />

                  <div className="space-y-4">
                        <Label>{t('appAppearance')}</Label>
                        <RadioGroup value={mode} onValueChange={(value: any) => handleModeChange(value)} className="flex gap-4">
                            <Label htmlFor="light-mode" className="flex items-center gap-2 cursor-pointer rounded-md border p-3 flex-1 justify-center data-[state=checked]:border-primary">
                               <RadioGroupItem value="light" id="light-mode" />
                               {t('light')}
                            </Label>
                             <Label htmlFor="dark-mode" className="flex items-center gap-2 cursor-pointer rounded-md border p-3 flex-1 justify-center data-[state=checked]:border-primary">
                               <RadioGroupItem value="dark" id="dark-mode" />
                               {t('dark')}
                            </Label>
                        </RadioGroup>
                  </div>
                  
                  <Separator />

                  <div className="space-y-4">
                      <Label>{t('primaryColor')}</Label>
                      <div className="flex gap-3">
                          <Button variant={theme === 'theme-green' ? 'default' : 'outline'} onClick={() => handleThemeChange('theme-green')} className="bg-[#5A9A58] hover:bg-[#5A9A58]/90 border-[#5A9A58]">{t('green')}</Button>
                          <Button variant={theme === 'theme-blue' ? 'default' : 'outline'} onClick={() => handleThemeChange('theme-blue')} className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 border-[#3B82F6]">{t('blue')}</Button>
                          <Button variant={theme === 'theme-orange' ? 'default' : 'outline'} onClick={() => handleThemeChange('theme-orange')} className="bg-[#F97316] hover:bg-[#F97316]/90 border-[#F97316]">{t('orange')}</Button>
                      </div>
                  </div>
              </CardContent>
          </Card>

          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Bell /> {t('notifications')}</CardTitle>
                  <CardDescription>{t('notificationsDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                          <Label htmlFor="general-notifications">{t('generalNotifications')}</Label>
                          <p className="text-sm text-muted-foreground">{t('generalNotificationsDesc')}</p>
                      </div>
                      <Switch id="general-notifications" defaultChecked />
                  </div>
                   <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                          <Label htmlFor="task-notifications">{t('taskNotifications')}</Label>
                          <p className="text-sm text-muted-foreground">{t('taskNotificationsDesc')}</p>
                      </div>
                      <Switch id="task-notifications" defaultChecked />
                  </div>
              </CardContent>
          </Card>

      </div>
    </main>
  );
}
