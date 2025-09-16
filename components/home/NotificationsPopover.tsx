'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  collectionGroup,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
  doc,
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
import { useAdmin } from '@/lib/hooks/useAdmin';

type Notification = {
  id: string;
  path: string;
  title: string;
  body: string;
  createdAt: Timestamp;
  read: boolean;
  target?: string;
};

export default function NotificationsPopover({ user }: { user: User }) {
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  
  const notificationsQuery = useMemo(() => {
    if (!user) return null;

    const targets = ['all', user.uid];
    // Admin user also gets notifications targeted to 'admin'
    if (isAdmin) {
      targets.push('admin');
    }

    return query(
      collectionGroup(db, 'notifications'),
      where('target', 'in', targets),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [user, isAdmin]);

  const [snapshot, loading] = useCollection(notificationsQuery);
  const [shownNotifications, setShownNotifications] = useState(new Set());

  const notifications = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, path: doc.ref.path, ...doc.data() } as Notification)
    );
  }, [snapshot]);

  useEffect(() => {
    if (loading || !notifications || notifications.length === 0) return;
    
    const unreadAndUnshown = notifications.find(
      (n) => !n.read && !shownNotifications.has(n.id)
    );

    if (unreadAndUnshown) {
      toast({
        title: unreadAndUnshown.title,
        description: unreadAndUnshown.body,
      });
      // Add to shown immediately to prevent re-toasting
      setShownNotifications((prev) => new Set(prev).add(unreadAndUnshown.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, loading, toast]);

  const hasUnread = useMemo(
    () => notifications.some((n) => !n.read),
    [notifications]
  );

  const handleOpen = async (open: boolean) => {
    if (open && hasUnread && notifications.length > 0) {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.read) {
          // The path property from collectionGroup is the full path to the document
          const docRef = doc(db, n.path);
          batch.update(docRef, { read: true });
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
