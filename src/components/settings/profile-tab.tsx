
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
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export function ProfileTab() {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();

  const [isSaving, setIsSaving] = React.useState(false);

  const [name, setName] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    if (user) {
      setName(user.displayName || user.name || "");
      setAvatarUrl(user.photoURL || "");
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  async function onProfileSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !auth.currentUser) return;

    setIsSaving(true);
    try {
      // Password change logic
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({ variant: "destructive", title: t("error"), description: t('confirmNewPassword') });
          setIsSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          toast({ variant: "destructive", title: t("error"), description: t('newPassword') + " must be at least 6 characters." });
          setIsSaving(false);
          return;
        }
        if (!currentPassword) {
          toast({ variant: "destructive", title: t("error"), description: t('currentPassword') + " is required to change it." });
          setIsSaving(false);
          return;
        }
        if (auth.currentUser.email) {
          const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser, credential);
          await updatePassword(auth.currentUser, newPassword);
          toast({ title: t("passwordChangedSuccess") });
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }
      }
      
      let newAvatarUrl = user.photoURL || "";
      if (avatarFile) {
        const storage = getStorage();
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, avatarFile);
        newAvatarUrl = await getDownloadURL(storageRef);
      }

      // Prepare update objects
      const profileUpdate: { displayName: string; photoURL?: string } = { displayName: name };
      const firestoreUpdate: { name: string; photoURL?: string } = { name: name };

      if (newAvatarUrl && newAvatarUrl !== user.photoURL) {
          profileUpdate.photoURL = newAvatarUrl;
          firestoreUpdate.photoURL = newAvatarUrl;
      }

      await updateProfile(auth.currentUser, profileUpdate);
      
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, firestoreUpdate);

      toast({ title: t("profileUpdated"), description: t("profileUpdatedSuccess") });

    } catch (error: any) {
      let description = t("profileUpdateFailed");
      if (error?.code === "auth/wrong-password") {
        description = t("wrongCurrentPassword");
      } else if (error?.code === 'auth/requires-recent-login') {
        description = 'This operation is sensitive and requires recent authentication. Please log out and log back in before retrying this request.';
      }
      console.error(error);
      toast({ variant: "destructive", title: t("error"), description });
    } finally {
      setIsSaving(false);
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
            {t("userProfile")}
          </CardTitle>
          <CardDescription>{t("userProfileDesc")}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Label>{t("profilePicture")}</Label>
            <div className="flex items-center gap-6 flex-wrap">
              <Avatar className="h-24 w-24 border">
                <AvatarImage
                  src={avatarUrl || undefined}
                  alt={t("profilePicture")}
                />
                <AvatarFallback>
                  <ImageIcon className="h-10 w-10 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <Button asChild variant="outline">
                <label className="cursor-pointer flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  <span>{t("changePicture")}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                id="name"
                placeholder={t("enterFullName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                {t("email")} ({t("cannotChange")})
              </Label>
              <Input id="email" readOnly disabled value={user?.email || ""} />
            </div>
          </div>
          
           <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <div className="flex items-center gap-2">
                  <Input id="userId" readOnly disabled value={user?.uid || ""} />
              </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4">
              {t("changePassword")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  {t("currentPassword")}
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
                  {t("newPassword")}
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t("leaveBlank")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("confirmNewPassword")}
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
            {isSaving ? t("saving") : t("saveChanges")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

    