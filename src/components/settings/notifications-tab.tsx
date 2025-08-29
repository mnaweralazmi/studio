
"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from "@/components/ui/label";
import { Bell } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export function NotificationsTab() {
    const { t } = useLanguage();

    return (
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
    );
}
