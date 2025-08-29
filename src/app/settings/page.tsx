
"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Award, Palette, Bell, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

import { ProfileTab } from '@/components/settings/profile-tab';
import { AchievementsTab } from '@/components/settings/achievements-tab';
import { DisplayTab } from '@/components/settings/display-tab';
import { NotificationsTab } from '@/components/settings/notifications-tab';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { language, t } = useLanguage();

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/login');
    };
    
    if (loading || !user) {
        return (
            <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                    <Skeleton className="h-28 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </main>
        );
    }

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user.photoURL || undefined} alt={t('profilePicture')} />
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
                <ProfileTab />
            </TabsContent>

            <TabsContent value="achievements" className="mt-6">
                 <AchievementsTab />
            </TabsContent>

            <TabsContent value="display" className="mt-6">
                <DisplayTab />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
                 <NotificationsTab />
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
