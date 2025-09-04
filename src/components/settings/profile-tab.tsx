
"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Save, Upload, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

import { useLanguage } from "@/context/language-context";
import { useAuth } from "@/context/auth-context";

import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export function ProfileTab() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();

  const [isSaving, setIsSaving] = React.useState(false);

  // form state
  const [name, setName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    if (user) {
      setName(user.displayName || user.name || "");
      setAvatarUrl(user.photoURL || "");
    }
  }, [user]);


  async function onProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !auth.currentUser) return;

    // The security rules disallow updating the user document,
    // so we can only handle password changes.
    
    if (newPassword || confirmPassword || currentPassword) {
      if (newPassword !== confirmPassword) {
        toast({ variant: "destructive", title: t("error" as any), description: "كلمتا المرور غير متطابقتين." });
        return;
      }
      if (newPassword.length < 6) {
        toast({ variant: "destructive", title: t("error" as any), description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." });
        return;
      }
      if (!currentPassword) {
        toast({ variant: "destructive", title: t("error" as any), description: "كلمة المرور الحالية مطلوبة لتغييرها." });
        return;
      }
    
      setIsSaving(true);
      try {
        if (newPassword && currentPassword && auth.currentUser.email) {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            toast({ title: t("passwordChangedSuccess" as any) });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        }
      } catch (error: any) {
        let description = t("profileUpdateFailed" as any);
        if (error?.code === "auth/wrong-password") {
            description = t("wrongCurrentPassword" as any);
        } else if (error?.code === 'auth/requires-recent-login') {
            description = 'This operation is sensitive and requires recent authentication. Please log in again before retrying this request.';
        }
        toast({ variant: "destructive", title: t("error" as any), description });
      } finally {
        setIsSaving(false);
      }
    } else {
        toast({ title: "Info", description: "Profile updates are disabled by security rules." });
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
           <Skeleton className="h-8 w-48" />
           <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-8">
            <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                 </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                 </div>
            </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-end">
            <Skeleton className="h-10 w-28" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={onProfileSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <User className="h-5 w-5 sm:h-6 sm:w-6" />
            {t("userProfile" as any)}
          </CardTitle>
          <CardDescription>{t("userProfileDesc" as any)}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Label>{t("profilePicture" as any)}</Label>
            <div className="flex items-center gap-6 flex-wrap">
              <Avatar className="h-24 w-24 border">
                <AvatarImage
                  src={avatarUrl || undefined}
                  alt={t("profilePicture" as any)}
                />
                <AvatarFallback>
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <Button asChild variant="outline" disabled>
                <label className="cursor-not-allowed flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  <span>{t("changePicture" as any)}</span>
                </label>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("fullName" as any)}</Label>
              <Input
                id="name"
                placeholder={t("enterFullName" as any)}
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                {t("email" as any)} ({t("cannotChange" as any)})
              </Label>
              <Input id="email" readOnly disabled value={user?.email || ""} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">
              {t("changePassword" as any)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  {t("currentPassword" as any)}
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  {t("newPassword" as any)}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t("leaveBlank" as any)}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("confirmNewPassword" as any)}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t pt-6 flex justify-end">
          <Button type="submit" disabled={isSaving}>
            <Save
              className={language === "ar" ? "ml-2 h-4 w-4" : "mr-2 h-4 w-4"}
            />
            {isSaving ? t("saving" as any) : t("saveChanges" as any)}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
