
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
import { User, Save, Upload } from 'lucide-react';
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

export function ProfileTab() {
    const { toast } = useToast();
    const { user, refreshUser } = useAuth();
    const { language, t } = useLanguage();
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: { name: "", email: "", bio: "", avatarUrl: "", currentPassword: "", newPassword: "", confirmPassword: "" },
    });
    
    React.useEffect(() => {
        if (user) {
            profileForm.reset({
                name: user.displayName || '',
                email: user.email || '',
                bio: (user as any).bio || '', // Casting to any to access custom property
                avatarUrl: user.photoURL || '',
            });
            setAvatarPreview(user.photoURL);
        }
    }, [user, profileForm]);
    
    async function onProfileSubmit(data: ProfileFormValues) {
        if (!user || !auth.currentUser) return;
        
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
                bio: data.bio, 
                avatarUrl: data.avatarUrl,
            }, { merge: true });

            setFileName(null);
            await refreshUser(); 
            toast({ title: t('profileUpdated'), description: t('profileUpdatedSuccess') });
            profileForm.reset({ ...profileForm.getValues(), currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
             let description = t('profileUpdateFailed');
             if (error.code === 'auth/wrong-password') {
                 description = t('wrongCurrentPassword');
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
                setAvatarPreview(dataUrl);
                setFileName(file.name);

                const storage = getStorage();
                const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
                
                try {
                    await uploadString(storageRef, dataUrl, 'data_url');
                    const downloadUrl = await getDownloadURL(storageRef);
                    profileForm.setValue('avatarUrl', downloadUrl);
                } catch(error) {
                    toast({ variant: "destructive", title: t('uploadFailed') });
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
                        <div className="flex items-center gap-6 flex-wrap">
                                <Avatar className="h-24 w-24">
                                <AvatarImage src={avatarPreview || undefined} alt={t('profilePicture')} />
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
                                <FormField control={profileForm.control} name="currentPassword" render={({ field }) => ( <FormItem><FormLabel>{t('currentPassword')}</FormLabel><FormControl><Input type="password" {...field} /></FormControl><FormMessage /></FormItem> )} />
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
    );
}
