
"use client";

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CalendarCheck, HandCoins, Award } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const badgeList = {
    explorer: { icon: BookOpen, titleKey: 'badgeExplorer', descriptionKey: 'badgeExplorerDesc' },
    planner: { icon: CalendarCheck, titleKey: 'badgePlanner', descriptionKey: 'badgePlannerDesc' },
    trader: { icon: HandCoins, titleKey: 'badgeTrader', descriptionKey: 'badgeTraderDesc' },
};
type BadgeId = keyof typeof badgeList;


export default function ProfilePage() {
    const { user, loading } = useAuth();
    const { t } = useLanguage();

    if (loading || !user) {
        return <div>{t('loading')}</div>;
    }
    
    const points = user.points || 0;
    const level = user.level || 1;
    const pointsForNextLevel = level * 100;
    const progress = (points % 100);

    const userBadges = user.badges || [];

    return (
        <main className="flex flex-1 flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={user.photoURL || 'https://placehold.co/100x100.png'} alt={user.displayName || ''} data-ai-hint="user avatar" />
                            <AvatarFallback>{user.displayName?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">{user.displayName || t('userProfile')}</CardTitle>
                            <CardDescription>{user.email}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>

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
            </div>
        </main>
    );
}
