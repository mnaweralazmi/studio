
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, BookOpen, CalendarCheck, HandCoins } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useAppContext } from "@/context/app-context";
import { Skeleton } from "../ui/skeleton";

const badgeList = {
  explorer: { icon: BookOpen, titleKey: "badgeExplorer", descriptionKey: "badgeExplorerDesc" },
  planner: { icon: CalendarCheck, titleKey: "badgePlanner", descriptionKey: "badgePlannerDesc" },
  trader: { icon: HandCoins, titleKey: "badgeTrader", descriptionKey: "badgeTraderDesc" },
} as const;
type BadgeId = keyof typeof badgeList;

export function AchievementsTab() {
  const { user, loading } = useAppContext();
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Award /> {t("achievements")}</CardTitle>
          <CardDescription>{t("achievementsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/4 ml-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Award /> {t("achievements")}</CardTitle>
          <CardDescription>{t("achievementsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Please log in to view your achievements.</div>
        </CardContent>
      </Card>
    );
  }

  const userBadges = Array.isArray(user.badges) ? user.badges.filter((b): b is BadgeId => typeof b === 'string' && b in badgeList) : [];
  
  const points = typeof user.points === "number" ? user.points : 0;
  const level = typeof user.level === "number" ? user.level : 1;
  const rawProgress = points % 100;
  const progress = Math.max(0, Math.min(100, Number(rawProgress)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Award /> {t("achievements")}</CardTitle>
        <CardDescription>{t("achievementsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <h3 className="font-semibold">{t("level")} {level}</h3>
            <p className="text-sm text-muted-foreground">{progress} / 100 {t("pointsToNextLevel")}</p>
          </div>
          <Progress value={progress} />
          <p className="text-right text-sm text-muted-foreground">{t("points")}: {points}</p>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold">{t("badges")}</h3>

          {userBadges.length > 0 ? (
            <TooltipProvider>
              <div className="flex flex-wrap gap-4">
                {userBadges.map((badgeId, idx) => {
                  const badgeInfo = badgeList[badgeId];
                  const Icon = badgeInfo.icon;
                  return (
                    <Tooltip key={`${badgeId}-${idx}`}>
                      <TooltipTrigger asChild>
                        <div
                          role="button"
                          aria-label={t(badgeInfo.titleKey as any)}
                          className="flex flex-col items-center gap-2 p-3 border rounded-lg w-24 h-24 justify-center bg-accent/50 hover:bg-accent transition-colors"
                        >
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
              <p>{t("noBadgesYet")}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
