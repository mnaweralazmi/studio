
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
import { User, Save, Palette, Bell, Languages, Upload, Award, BookOpen, CalendarCheck, HandCoins, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useLanguage, Language } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';


const profileFormSchema = z.object({
    name: z.string().min(3, "يجب أن يتكون الاسم من 3 أحرف على الأقل."),
    email: z.string().email("البريد الإلكتروني غير صالح."),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "يجب أن تكون كلمة المرور 6 أحرف على الأقل.").optional().or(z.literal('')),
    confirmPassword: z.string().optional(),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
}).refine(data => {
    if (data.newPassword) {
        return data.newPassword === data.confirmPassword;
    }
    return true;
}, {
    message: "كلمتا المرور غير متطابقتين.",
    path: ["confirmPassword"],
}).refine(data => {
    if (data.newPassword) {
        return !!data.currentPassword;
    }
    return true;
}, {
    message: "كلمة المرور الحالية مطلوبة لتغييرها.",
    path: ["currentPassword"],
});


type ProfileFormValues = z.infer<typeof profileFormSchema>;

type Theme = "theme-green" | "theme-blue" | "theme-orange";
type Mode = "light" | "dark";

const badgeList = {
    explorer: { icon: BookOpen, titleKey: 'badgeExplorer', descriptionKey: 'badgeExplorerDesc' },
    planner: { icon: CalendarCheck, titleKey: 'badgePlanner', descriptionKey: 'badgePlannerDesc' },
    trader: { icon: HandCoins, titleKey: 'badgeTrader', descriptionKey: 'badgeTraderDesc' },
};
type BadgeId = keyof typeof badgeList;


export default function SettingsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { user, loading, refreshUser } = useAuth();
    const [theme, setTheme] = React.useState<Theme>('theme-green');
    const [mode, setMode] = React.useState<Mode>('dark');
    const { language, setLanguage, t } = useLanguage();
    const [fileName, setFileName] = React.useState<string | null>(null);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: { name: "", email: "", bio: "", avatarUrl: "", currentPassword: "", newPassword: "", confirmPassword: "" },
    });
    
    React.useEffect(() => {
        if (user) {
            profileForm.reset({
                name: user.displayName || user.name || '',
                email: user.email || '',
                bio: user.bio || '',
                avatarUrl: user.photoURL || user.avatarUrl || '',
            });
        }

        const savedTheme = localStorage.getItem('theme') as Theme || 'theme-green';
        const savedMode = localStorage.getItem('mode') as Mode || 'dark';
        
        setTheme(savedTheme);
        setMode(savedMode);

        document.body.classList.remove('theme-green', 'theme-blue', 'theme-orange');
        document.body.classList.add(savedTheme);
        
        const html = document.documentElement;
        html.classList.remove('light', 'dark');
        html.classList.add(savedMode);

    }, [user, profileForm]);
    
    const avatarUrl = profileForm.watch('avatarUrl');

    async function onProfileSubmit(data: ProfileFormValues) {
        if (!user) return;
        
        try {
            // Update password if provided
            if (data.newPassword && data.currentPassword) {
                if(user.email) {
                    const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
                    await reauthenticateWithCredential(user, credential);
                    await updatePassword(user, data.newPassword);
                    toast({ title: "تم تحديث كلمة المرور بنجاح" });
                }
            }

            // Update profile info
            await updateProfile(user, { displayName: data.name, photoURL: data.avatarUrl });
            
            // Update user data in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { 
                name: data.name, 
                bio: data.bio, 
                avatarUrl: data.avatarUrl,
            }, { merge: true });

            setFileName(null);
            refreshUser(); // Refresh user data in context
            toast({ title: t('profileUpdated'), description: t('profileUpdatedSuccess') });
            profileForm.reset({ ...profileForm.getValues(), currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
             let description = t('profileUpdateFailed');
             if (error.code === 'auth/wrong-password') {
                 description = 'كلمة المرور الحالية غير صحيحة.';
             }
             toast({ variant: "destructive", title: t('error'), description: description });
        }
    }

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return;
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const dataUrl = reader.result as string;
                profileForm.setValue('avatarUrl', dataUrl); // show preview immediately
                setFileName(file.name);

                // Upload to Firebase Storage
                const storage = getStorage();
                const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
                
                try {
                    await uploadString(storageRef, dataUrl, 'data_url');
                    const downloadUrl = await getDownloadURL(storageRef);
                    profileForm.setValue('avatarUrl', downloadUrl); // update with final URL
                } catch(error) {
                    toast({ variant: "destructive", title: "فشل رفع الصورة" });
                }
            };
            reader.readAsDataURL(file);
        }
    };

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

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/login');
    };
    
    if (loading || !user) {
        return <div>{t('loading')}</div>;
    }
    
    const points = user.points || 0;
    const level = user.level || 1;
    const progress = (points % 100);
    const userBadges = user.badges || [];

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user.photoURL || 'https://placehold.co/100x100.png'} alt={t('profilePicture')} />
                    <AvatarFallback>{user.displayName?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-2xl">{user.displayName || t('userProfile')}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                </div>
            </CardHeader>
        </Card>

        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" />{t('profile')}</TabsTrigger>
                <TabsTrigger value="achievements"><Award className="mr-2 h-4 w-4" />{t('achievements')}</TabsTrigger>
                <TabsTrigger value="display"><Palette className="mr-2 h-4 w-4" />{t('displayAndLanguage')}</TabsTrigger>
                <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" />{t('notifications')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="mt-6">
              <Card>
                <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"> <User className="h-5 w-5 sm:h-6 sm:w-6" /> {t('userProfile')} </CardTitle>
                            <CardDescription> {t('userProfileDesc')} </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="flex items-center gap-6 flex-wrap">
                                 <Avatar className="h-24 w-24">
                                    <AvatarImage src={avatarUrl || 'https://placehold.co/100x100.png'} alt={t('profilePicture')} />
                                    <AvatarFallback>{user?.displayName?.[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-[200px]">
                                    <FormField
                                      control={profileForm.control}
                                      name="avatarUrl"
                                      render={() => (
                                        <FormItem>
                                          <FormLabel>{t('profilePicture')}</FormLabel>
                                          <FormControl>
                                            <div className="flex flex-col gap-2">
                                              <Button asChild variant="outline" className="w-fit">
                                                <Label className="cursor-pointer">
                                                  <Upload className="h-4 w-4" />
                                                  <span>{t('changePicture')}</span>
                                                  <Input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                                                </Label>
                                              </Button>
                                              <p className="text-xs text-muted-foreground">
                                                 {fileName || t('noFileSelected')}
                                              </p>
                                            </div>
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={profileForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{t('fullName')}</FormLabel><FormControl><Input placeholder={t('enterFullName')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                                 <FormField control={profileForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>{t('email')} ({t('cannotChange')})</FormLabel><FormControl><Input readOnly disabled {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                             <div>
                                <h3 className="text-lg font-medium mb-4">{t('changePassword')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField control={profileForm.control} name="currentPassword" render={({ field }) => ( <FormItem><FormLabel>كلمة المرور الحالية</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={profileForm.control} name="newPassword" render={({ field }) => ( <FormItem><FormLabel>{t('newPassword')}</FormLabel><FormControl><Input type="password" placeholder={t('leaveBlank')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                                    <FormField control={profileForm.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>{t('confirmNewPassword')}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                </div>
                            </div>
                            <FormField control={profileForm.control} name="bio" render={({ field }) => ( <FormItem><FormLabel>{t('bio')}</FormLabel><FormControl><Textarea placeholder={t('bioPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </CardContent>
                        <CardFooter className="border-t pt-6 flex justify-end">
                            <Button type="submit"> <Save className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} /> {t('saveChanges')} </Button>
                        </CardFooter>
                    </form>
                </Form>
              </Card>
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Award /> {t('achievements')}</CardTitle>
                        <CardDescription>{t('achievementsDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                             <div className="flex justify-between items-end">
                                <h3 className="font-semibold">{t('level')} {level}</h3>
                                <p className="text-sm text-muted-foreground">{points % 100} / 100 {t('pointsToNextLevel')}</p>
                            </div>
                            <Progress value={progress} />
                            <p className="text-right text-sm text-muted-foreground">{t('points')}: {points}</p>
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-semibold">{t('badges')}</h3>
                            {userBadges.length > 0 ? (
                                <TooltipProvider>
                                    <div className="flex flex-wrap gap-4">
                                    {userBadges.map(badgeId => {
                                        const badgeInfo = badgeList[badgeId as BadgeId];
                                        if (!badgeInfo) return null;
                                        const Icon = badgeInfo.icon;
                                        return (
                                            <Tooltip key={badgeId}>
                                                <TooltipTrigger asChild>
                                                    <div className="flex flex-col items-center gap-2 p-3 border rounded-lg w-24 h-24 justify-center bg-accent/50 hover:bg-accent transition-colors">
                                                        <Icon className="h-8 w-8 text-primary" />
                                                        <span className="text-xs text-center font-medium">{t(badgeInfo.titleKey as any)}</span>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t(badgeInfo.descriptionKey as any)}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    })}
                                    </div>
                                </TooltipProvider>
                            ) : (
                                <div className="text-center text-muted-foreground py-4 border rounded-lg">
                                    <p>{t('noBadgesYet')}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="display" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Palette className="h-5 w-5 sm:h-6 sm:w-6" /> {t('displayAndLanguage')}</CardTitle>
                        <CardDescription>{t('displayAndLanguageDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Languages className="h-4 w-4" /> {t('language')}</Label>
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
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Bell className="h-5 w-5 sm:h-6 sm:w-6"/> {t('notifications')}</CardTitle>
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
            </TabsContent>
        </Tabs>
        <div className="mt-8">
            <Button variant="destructive" className="w-full" onClick={handleLogout}>
                <LogOut className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} />
                {t('logout')}
            </Button>
        </div>
      </div>
    </main>
  );
}

    