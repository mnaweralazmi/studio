
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wrench } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, getDocs, writeBatch } from "firebase/firestore";

const COLLECTIONS_TO_MIGRATE = ['sales', 'expenses', 'debts', 'workers', 'tasks'];

export function MaintenanceTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [isMigrating, setIsMigrating] = React.useState(false);

  const handleMigration = async () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: t("error"),
            description: "You must be logged in to perform this action.",
        });
        return;
    }

    setIsMigrating(true);
    try {
        const batch = writeBatch(db);
        let updatedDocsCount = 0;

        for (const collectionName of COLLECTIONS_TO_MIGRATE) {
            const colRef = collection(db, collectionName);
            const snapshot = await getDocs(colRef);

            snapshot.forEach(docSnapshot => {
                const data = docSnapshot.data();
                if (!data.ownerId) {
                    batch.update(docSnapshot.ref, { ownerId: user.uid });
                    updatedDocsCount++;
                }
            });
        }

        if (updatedDocsCount > 0) {
            await batch.commit();
        }

        toast({
            title: t("migrationSuccess"),
            description: `${t("migrationSuccessDesc")} (${updatedDocsCount} ${t('records')})`,
        });

    } catch (error: any) {
        console.error("Migration failed:", error);
        toast({
            variant: "destructive",
            title: t("migrationError"),
            description: error.message || t("migrationErrorDesc"),
        });
    } finally {
        setIsMigrating(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
          <Wrench className="h-5 w-5 sm:h-6 sm:w-6" />
          {t("maintenanceTools")}
        </CardTitle>
        <CardDescription>{t("maintenanceToolsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border p-4">
            <h3 className="font-semibold text-lg">{t('dataMigration')}</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
                {t('dataMigrationDesc')}
            </p>
            <Button onClick={handleMigration} disabled={isMigrating}>
                {isMigrating ? t('migrationInProgress') : t('startDataMigration')}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
