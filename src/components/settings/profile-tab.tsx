
"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';

export function ProfileTab() {
    const { toast } = useToast();
    const { user, refreshUser } = useAuth();
    const { t } = useLanguage();
    const [isSaving, setIsSaving] = React.useState(false);
    
    // State for form fields
    const [name, setName] = React.useState('');
    const [avatarUrl, setAvatarUrl] = React.useState('');
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');

    const [isDirty, setIsDirty] = React.useState(false);
    
    React.useEffect(() => {
        if (user) {
            setName(user.displayName || '');
            setAvatarUrl(user.photoURL || '');
        }
    }, [user]);

    const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        setIsDirty(true);
    };

    async function onProfileSubmit(event: React.FormEvent) {
        event.preventDefault();
        if (!user || !auth.currentUser) return;

        if (newPassword && newPassword !== confirmPassword) {
            toast({ variant: "destructive", title: t('error'), description: "كلمتا المرور غير متطابقتين." });
            return;
        }
        if (newPassword && !currentPassword) {
            toast({ variant: "destructive", title: t('error'), description: "كلمة المرور الحالية مطلوبة لتغييرها." });
            return;
        }

        setIsSaving(true);
        
        try {
            // Update password if provided
            if (newPassword && currentPassword && auth.currentUser.email) {
                const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
                await reauthenticateWithCredential(auth.currentUser, credential);
                await updatePassword(auth.currentUser, newPassword);
                toast({ title: t('passwordChangedSuccess') });
            }

            // Update profile info in Auth
            await updateProfile(auth.currentUser, { displayName: name, photoURL: avatarUrl });
            
            // Update user data in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { 
                name: name,
                email: user.email, // email is read-only but good to pass it
                photoURL: avatarUrl,
            }, { merge: true });
            
            await refreshUser(); 
            toast({ title: t('profileUpdated'), description: t('profileUpdatedSuccess') });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsDirty(false);

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
                setAvatarUrl(dataUrl); // Temporarily set to dataURL for preview
                setIsDirty(true);
                
                const { id } = toast({ title: "جاري رفع الصورة..."});

                const storage = getStorage();
                const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
                
                try {
                    await uploadString(storageRef, dataUrl, 'data_url');
                    const downloadUrl = await getDownloadURL(storageRef);
                    setAvatarUrl(downloadUrl);
                    toast({ id, title: "تم رفع الصورة بنجاح!", description: "لا تنس حفظ التغييرات."});
                } catch(error) {
                    toast({ id, variant: "destructive", title: t('uploadFailed') });
                    setAvatarUrl(user.photoURL || ''); // Revert on failure
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (!user) return <Card><CardContent><Skeleton className="h-96 w-full" /></CardContent></Card>;

    return (
        <Card>
            <form onSubmit={onProfileSubmit}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"> <User className="h-5 w-5 sm:h-6 sm:w-6" /> {t('userProfile')} </CardTitle>
                    <CardDescription> {t('userProfileDesc')} </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-2">
                        <Label>{t('profilePicture')}</Label>
                        <div className="flex items-center gap-6 flex-wrap">
                            <Avatar className="h-24 w-24 border">
                                <AvatarImage src={avatarUrl || undefined} alt={t('profilePicture')} />
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
                    </div>
                        
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('fullName')}</Label>
                            <Input id="name" placeholder={t('enterFullName')} value={name} onChange={handleFieldChange(setName)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('email')} ({t('cannotChange')})</Label>
                            <Input id="email" readOnly disabled value={user.email || ''} />
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-medium mb-4">{t('changePassword')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                                <Input id="currentPassword" type="password" value={currentPassword} onChange={handleFieldChange(setCurrentPassword)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="newPassword">{t('newPassword')}</Label>
                                <Input id="newPassword" type="password" placeholder={t('leaveBlank')} value={newPassword} onChange={handleFieldChange(setNewPassword)} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
                                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={handleFieldChange(setConfirmPassword)} />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-6 flex justify-end">
                    <Button type="submit" disabled={isSaving || !isDirty}> 
                        <Save className={language === 'ar' ? 'ml-2 h-4 w-4' : 'mr-2 h-4 w-4'} /> 
                        {isSaving ? t('saving') : t('saveChanges')} 
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
