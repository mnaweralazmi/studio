
"use client";

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Palette, Languages } from 'lucide-react';
import { useLanguage, Language } from '@/context/language-context';
import { useToast } from "@/hooks/use-toast";

type Theme = "theme-green" | "theme-blue" | "theme-orange";
type Mode = "light" | "dark";

export function DisplayTab() {
    const { toast } = useToast();
    const { language, setLanguage, t } = useLanguage();
    const [theme, setTheme] = React.useState<Theme>('theme-green');
    const [mode, setMode] = React.useState<Mode>('dark');
    
    React.useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as Theme || 'theme-green';
        const savedMode = localStorage.getItem('mode') as Mode || 'dark';
        
        setTheme(savedTheme);
        setMode(savedMode);
    }, []);

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        document.body.classList.remove('theme-green', 'theme-blue', 'theme-orange');
        document.body.classList.add(newTheme);
        localStorage.setItem('theme', newTheme);
        toast({ title: t('themeChanged') });
    };

    const handleModeChange = (newMode: Mode) => {
        setMode(newMode);
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newMode);
        localStorage.setItem('mode', newMode);
        toast({ title: newMode === 'dark' ? t('darkModeActivated') : t('lightModeActivated') });
    };

    const handleLanguageChange = (newLang: Language) => {
        setLanguage(newLang);
        toast({ title: t('languageChanged'), description: t('languageChangedSuccess') });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl"><Palette className="h-5 w-5 sm:h-6 sm:w-6" /> {t('displayAndLanguage')}</CardTitle>
                <CardDescription>{t('displayAndLanguageDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Languages className="h-4 w-4" /> {t('language')}</Label>
                    <Select value={language} onValueChange={(value: Language) => handleLanguageChange(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder={t('selectLanguage')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ar">العربية</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <Separator />

                <div className="space-y-4">
                        <Label>{t('appAppearance')}</Label>
                        <RadioGroup value={mode} onValueChange={(value: any) => handleModeChange(value)} className="flex gap-4">
                            <Label htmlFor="light-mode" className="flex items-center gap-2 cursor-pointer rounded-md border p-3 flex-1 justify-center data-[state=checked]:border-primary">
                                <RadioGroupItem value="light" id="light-mode" />
                                {t('light')}
                            </Label>
                                <Label htmlFor="dark-mode" className="flex items-center gap-2 cursor-pointer rounded-md border p-3 flex-1 justify-center data-[state=checked]:border-primary">
                                <RadioGroupItem value="dark" id="dark-mode" />
                                {t('dark')}
                            </Label>
                        </RadioGroup>
                </div>
                
                <Separator />

                <div className="space-y-4">
                    <Label>{t('primaryColor')}</Label>
                    <div className="flex gap-3">
                        <Button variant={theme === 'theme-green' ? 'default' : 'outline'} onClick={() => handleThemeChange('theme-green')} className="bg-[#5A9A58] hover:bg-[#5A9A58]/90 border-[#5A9A58]">{t('green')}</Button>
                        <Button variant={theme === 'theme-blue' ? 'default' : 'outline'} onClick={() => handleThemeChange('theme-blue')} className="bg-[#3B82F6] hover:bg-[#3B82F6]/90 border-[#3B82F6]">{t('blue')}</Button>
                        <Button variant={theme === 'theme-orange' ? 'default' : 'outline'} onClick={() => handleThemeChange('theme-orange')} className="bg-[#F97316] hover:bg-[#F97316]/90 border-[#F97316]">{t('orange')}</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
