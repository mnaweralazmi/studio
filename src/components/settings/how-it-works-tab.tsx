
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { GitBranch, Database, Fingerprint, Files, BarChartHorizontal } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function HowItWorksTab() {
  const { t } = useLanguage();

  const dataPoints = [
    {
      icon: Database,
      title: t('dataPoint1Title'),
      description: t('dataPoint1Desc'),
    },
    {
      icon: Fingerprint,
      title: t('dataPoint2Title'),
      description: t('dataPoint2Desc'),
    },
    {
      icon: Files,
      title: t('dataPoint3Title'),
      description: t('dataPoint3Desc'),
    },
    {
      icon: BarChartHorizontal,
      title: t('dataPoint4Title'),
      description: t('dataPoint4Desc'),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <GitBranch className="h-5 w-5 sm:h-6 sm:w-6" /> 
            {t('howItWorks')}
        </CardTitle>
        <CardDescription>{t('howItWorksDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {dataPoints.map((point, index) => {
          const Icon = point.icon;
          return (
            <div key={index} className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{point.title}</h3>
                <p className="text-muted-foreground">{point.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
