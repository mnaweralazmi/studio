
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { User, Save, Upload, Image as ImageIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const profileFormSchema = z.object({
    name: z.string().min(3, "يجب أن يتكون الاسم من 3 أحرف على الأقل."),
    email: z.string().email("البريد الإلكتروني غير صالح."),
    avatarUrl: z.string().optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmPassword: z.string().optional(),
}).refine(data => {
    // If newPassword has a value, then confirmPassword must match it.
    if (data.newPassword) {
        return data.newPassword === data.confirmPassword;
    }
    return true;
}, {
    message: "كلمتا المرور غير متطابقتين.",
    path: ["confirmPassword"],
}).refine(data => {
    // If newPassword has a value, then currentPassword must also have a value.
    if (data.newPassword && !data.currentPassword) {
        return false;
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
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
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
                email: data.email, // email is read-only but good to pass it
                photoURL: data.avatarUrl,
            }, { merge: true });
            
            await refreshUser(); 
            toast({ title: t('profileUpdated'), description: t('profileUpdatedSuccess') });
            profileForm.reset({ ...data, currentPassword: '', newPassword: '', confirmPassword: '' });

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
                profileForm.setValue('avatarUrl', dataUrl, { shouldDirty: true }); // Temporarily set to dataURL for preview
                
                const { id } = toast({ title: "جاري رفع الصورة..."});

                const storage = getStorage();
                const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
                
                try {
                    await uploadString(storageRef, dataUrl, 'data_url');
                    const downloadUrl = await getDownloadURL(storageRef);
                    profileForm.setValue('avatarUrl', downloadUrl, { shouldDirty: true });
                    toast({ id, title: "تم رفع الصورة بنجاح!", description: "لا تنس حفظ التغييرات."});
                } catch(error) {
                    toast({ id, variant: "destructive", title: t('uploadFailed') });
                    profileForm.setValue('avatarUrl', user.photoURL || '', { shouldDirty: false }); // Revert on failure
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (!user) return <Card><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>;
    
    const avatarPreview = profileForm.watch('avatarUrl');

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
                                            <label className="cursor-pointer flex items-center">
                                                <Upload className="h-4 w-4 mr-2" />
                                                <span>{t('changePicture')}</span>
                                                <Input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                                            </label>
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
                                <FormField control={profileForm.control} name="currentPassword" render={({ field }) => ( <FormItem><FormLabel>{t('currentPassword')}</FormLabel><FormControl><Input type="password" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={profileForm.control} name="newPassword" render={({ field }) => ( <FormItem><FormLabel>{t('newPassword')}</FormLabel><FormControl><Input type="password" placeholder={t('leaveBlank')} {...field} value={field.value || ''}/></FormControl><FormMessage /></FormItem> )} />
                                <FormField control={profileForm.control} name="confirmPassword" render={({ field }) => ( <FormItem><FormLabel>{t('confirmNewPassword')}</FormLabel><FormControl><Input type="password" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t pt-6 flex justify-end">
                        <Button type="submit" disabled={isSaving || !profileForm.formState.isDirty}> 
                            <Save className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} /> 
                            {isSaving ? t('saving') : t('saveChanges')} 
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}

    