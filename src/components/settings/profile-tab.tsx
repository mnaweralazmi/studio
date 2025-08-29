
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { User, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const profileFormSchema = z.object({
    name: z.string().min(3, "يجب أن يتكون الاسم من 3 أحرف على الأقل."),
    email: z.string().email("البريد الإلكتروني غير صالح."),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "يجب أن تكون كلمة المرور 6 أحرف على الأقل.").optional().or(z.literal('')),
    confirmPassword: z.string().optional(),
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

export function ProfileTab() {
    const { toast } = useToast();
    const { user, refreshUser } = useAuth();
    const { language, t } = useLanguage();
    const [isSaving, setIsSaving] = React.useState(false);
    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: { name: "", email: "", avatarUrl: "", currentPassword: "", newPassword: "", confirmPassword: "" },
    });
    
    React.useEffect(() => {
        if (user) {
            profileForm.reset({
                name: user.displayName || '',
                email: user.email || '',
                avatarUrl: user.photoURL || '',
            });
            setAvatarPreview(user.photoURL);
        }
    }, [user, profileForm]);
    
    async function onProfileSubmit(data: ProfileFormValues) {
        if (!user || !auth.currentUser) return;
        setIsSaving(true);
        
        try {
            // Update password if provided
            if (data.newPassword && data.currentPassword) {
                if(auth.currentUser.email) {
                    const credential = EmailAuthProvider.credential(auth.currentUser.email, data.currentPassword);
                    await reauthenticateWithCredential(auth.currentUser, credential);
                    await updatePassword(auth.currentUser, data.newPassword);
                    toast({ title: t('passwordChangedSuccess') });
                }
            }

            // Update profile info in Auth
            await updateProfile(auth.currentUser, { displayName: data.name, photoURL: data.avatarUrl });
            
            // Update user data in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { 
                name: data.name, 
                avatarUrl: data.avatarUrl,
            }, { merge: true });
            
            await refreshUser(); 
            toast({ title: t('profileUpdated'), description: t('profileUpdatedSuccess') });
            profileForm.reset({ ...profileForm.getValues(), currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
             let description = t('profileUpdateFailed');
             if (error.code === 'auth/wrong-password') {
                 description = t('wrongCurrentPassword');
             }
             toast({ variant: "destructive", title: t('error'), description: description });
        } finally {
            setIsSaving(false);
        }
    }

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) return;
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const dataUrl = reader.result as string;
                setAvatarPreview(dataUrl);
                
                // Show loading toast
                const { id } = toast({ title: "جاري رفع الصورة..."});

                const storage = getStorage();
                const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
                
                try {
                    await uploadString(storageRef, dataUrl, 'data_url');
                    const downloadUrl = await getDownloadURL(storageRef);
                    profileForm.setValue('avatarUrl', downloadUrl);
                    toast({ id, title: "تم رفع الصورة بنجاح!", description: "لا تنس حفظ التغييرات."});
                } catch(error) {
                    toast({ id, variant: "destructive", title: t('uploadFailed') });
                    setAvatarPreview(user.photoURL); // Revert preview on failure
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (!user) return null;

    return (
        <Card>
            <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"> <User className="h-5 w-5 sm:h-6 sm:w-6" /> {t('userProfile')} </CardTitle>
                        <CardDescription> {t('userProfileDesc')} </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <FormField
                            control={profileForm.control}
                            name="avatarUrl"
                            render={() => (
                                <FormItem>
                                    <FormLabel>{t('profilePicture')}</FormLabel>
                                    <div className="flex items-center gap-6 flex-wrap">
                                        <Avatar className="h-24 w-24 border">
                                            <AvatarImage src={avatarPreview || undefined} alt={t('profilePicture')} />
                                            <AvatarFallback>
                                                <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button asChild variant="outline">
                                            <Label className="cursor-pointer">
                                                <Upload className="h-4 w-4" />
                                                <span>{t('changePicture')}</span>
                                                <Input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                                            </Label>
                                        </Button>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                            
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={profileForm.control} name="name" render={({ field }) => ( <FormItem><FormLabel>{t('fullName')}</FormLabel><FormControl><Input placeholder={t('enterFullName')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={profileForm.control} name="email" render={({ field }) => ( <FormItem><FormLabel>{t('email')} ({t('cannotChange')})</FormLabel><FormControl><Input readOnly disabled {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-medium mb-4">{t('changePassword')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField control={profileForm.control} name="currentPassword" render={({ field }) => ( <FormItem><FormLabel>{t('currentPassword')}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={profileForm.control} name="newPassword" render={({ field }) => ( <FormItem><FormLabel>{t('newPassword')}</FormLabel><FormControl><Input type="password" placeholder={t('leaveBlank')} {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={profileForm.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>{t('confirmNewPassword')}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6 flex justify-end">
                        <Button type="submit" disabled={isSaving}> 
                            <Save className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} /> 
                            {isSaving ? 'جاري الحفظ...' : t('saveChanges')} 
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
