
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Wrench, Info } from 'lucide-react';
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { collection, getDocs, writeBatch, query } from "firebase/firestore";
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
        const q = query(collection(db, collectionName));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach(docSnap => {
          const data = docSnap.data();
          // IMPORTANT: Only update documents that are missing ownerId.
          // This assumes that if ownerId is missing, departmentId is also missing for relevant collections.
          if (!data.ownerId) {
            const updateData: { ownerId: string; departmentId?: string } = { ownerId: user.uid };
            
            // Add departmentId only to collections that need it.
            if (['sales', 'expenses', 'debts', 'workers'].includes(collectionName)) {
                // We assign a default department because we can't know the original one.
                // The user can re-categorize them later if needed.
                updateData.departmentId = 'agriculture';
            }
            
            batch.update(docSnap.ref, updateData);
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
