
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wrench, Info } from 'lucide-react';
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { collection, getDocs, writeBatch, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const collectionsToMigrate = ['sales', 'expenses', 'debts', 'workers', 'tasks'];

export function MaintenanceTab() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleMigration = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: t('error'), description: 'You must be logged in.' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      let totalUpdated = 0;
      const batch = writeBatch(db);

      for (const collectionName of collectionsToMigrate) {
        // Query for documents that do NOT have the ownerId field.
        // Firestore doesn't support a "not exists" query directly, so we query for documents
        // that are missing the field and belong to the user (a workaround).
        // Since the old data doesn't have ownerId, we have to fetch all and filter client-side.
        // This is not ideal for very large datasets, but necessary for this one-time migration.
        const q = query(collection(db, collectionName));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(docSnap => {
          // IMPORTANT: Only update documents that BELONG TO THE USER but are missing the ownerId.
          // In this specific app's case, we assume all data belongs to the logged-in user as there's no data sharing.
          if (!docSnap.data().ownerId) {
            batch.update(docSnap.ref, { ownerId: user.uid });
            totalUpdated++;
          }
        });
      }

      if (totalUpdated > 0) {
        await batch.commit();
        toast({
          title: t('migrationSuccess'),
          description: `${t('migrationSuccessDesc')} (${totalUpdated} ${t('records')})`,
        });
      } else {
        toast({
          title: t('migrationSuccess'),
          description: "No records needed updating.",
        });
      }

    } catch (error) {
      console.error("Migration failed:", error);
      toast({
        variant: 'destructive',
        title: t('migrationError'),
        description: t('migrationErrorDesc'),
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wrench /> {t('maintenanceTools')}</CardTitle>
        <CardDescription>{t('maintenanceToolsDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>{t('dataMigration')}</AlertTitle>
            <AlertDescription>
                {t('dataMigrationDesc')}
            </AlertDescription>
        </Alert>

        <Button onClick={handleMigration} disabled={isLoading}>
            {isLoading ? t('migrationInProgress') : t('startDataMigration')}
        </Button>

      </CardContent>
    </Card>
  );
}
