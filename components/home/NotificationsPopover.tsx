'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

import { Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';

type Notification = {
  id: string;
  title: string;
  body: string;
  createdAt: Timestamp;
  read: boolean;
};

export default function NotificationsPopover({ user }: { user: User }) {
  const { toast } = useToast();
  const notificationsQuery = useMemo(
    () =>
      user
        ? query(
            collection(db, 'notifications'),
            where('target', 'in', ['all', user.uid]),
            orderBy('createdAt', 'desc'),
            limit(10)
          )
        : null,
    [user]
  );

  const [snapshot, loading] = useCollection(notificationsQuery);
  const [shownNotifications, setShownNotifications] = useState(new Set());

  const notifications = useMemo(() => {
    return (
      snapshot?.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Notification)
      ) || []
    );
  }, [snapshot]);

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const unreadAndUnshown = notifications.find(
      (n) => !n.read && !shownNotifications.has(n.id)
    );

    if (unreadAndUnshown) {
      toast({
        title: unreadAndUnshown.title,
        description: unreadAndUnshown.body,
      });
      setShownNotifications((prev) => new Set(prev).add(unreadAndUnshown.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, toast]);

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.read),
    [notifications]
  );

  const handleOpen = async (open: boolean) => {
    if (open && hasUnread && snapshot) {
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => {
        if (!d.data().read) {
          batch.update(d.ref, { read: true });
        }
      });
      try {
        await batch.commit();
      } catch (error) {
        console.error('Error marking notifications as read: ', error);
      }
    }
  };

  return (
    <Popover onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">الإشعارات</h4>
            <p className="text-sm text-muted-foreground">
              آخر الإشعارات والتحديثات.
            </p>
          </div>
          <div className="grid gap-2">
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0"
                >
                  <span
                    className={`flex h-2 w-2 translate-y-1 rounded-full ${
                      !n.read ? 'bg-sky-500' : 'bg-muted'
                    }`}
                  />
                  <div className="grid gap-1">
                    <p className="text-sm font-medium leading-none">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {n.createdAt
                        ? formatDistanceToNow(n.createdAt.toDate(), {
                            addSuffix: true,
                            locale: ar,
                          })
                        : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">
                لا توجد إشعارات جديدة.
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
