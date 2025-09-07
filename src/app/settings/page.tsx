
"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Award, Palette, Bell, LogOut, GitBranch } from 'lucide-react';

import { ProfileTab } from '@/components/settings/profile-tab';
import { AchievementsTab } from '@/components/settings/achievements-tab';
import { DisplayTab } from '@/components/settings/display-tab';
import { NotificationsTab } from '@/components/settings/notifications-tab';
import { HowItWorksTab } from '@/components/settings/how-it-works-tab';

type SettingsSection = 'profile' | 'achievements' | 'display' | 'notifications' | 'how-it-works';

export default function SettingsPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { language, t } = useLanguage();
    const [activeSection, setActiveSection] = React.useState<SettingsSection>('profile');

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/login');
    };

    const menuItems = [
        { id: 'profile', label: t('profile'), icon: User },
        { id: 'achievements', label: t('achievements'), icon: Award },
        { id: 'display', label: t('displayAndLanguage'), icon: Palette },
        { id: 'notifications', label: t('notifications'), icon: Bell },
        { id: 'how-it-works', label: t('howItWorks'), icon: GitBranch },
    ] as const;

    const renderContent = () => {
        switch (activeSection) {
            case 'profile': return <ProfileTab />;
            case 'achievements': return <AchievementsTab />;
            case 'display': return <DisplayTab />;
            case 'notifications': return <NotificationsTab />;
            case 'how-it-works': return <HowItWorksTab />;
            default: return <ProfileTab />;
        }
    };
    
    if (loading || !user) {
        return (
            <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
                    <Skeleton className="h-20 w-full" />
                    <div className="flex gap-8">
                        <Skeleton className="h-96 w-1/3" />
                        <Skeleton className="h-96 w-2/3" />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8 bg-muted/40">
            <div className="w-full max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('settings')}</h1>
                    <p className="text-muted-foreground">{t('userProfileDesc')}</p>
                </header>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1">
                        <nav className="flex flex-col gap-2">
                            {menuItems.map(item => {
                                const Icon = item.icon;
                                return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                        "justify-start text-base font-medium",
                                        activeSection === item.id && "bg-primary/10 text-primary border-primary/30 border-r-4"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </button>
                                )}
                            )}
                            <hr className="my-4" />
                             <button
                                onClick={handleLogout}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-destructive transition-all hover:bg-destructive/10",
                                     "justify-start text-base font-medium"
                                )}
                            >
                                <LogOut className="h-5 w-5" />
                                {t('logout')}
                            </button>
                        </nav>
                    </aside>

                    <div className="lg:col-span-3">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </main>
    );
}
