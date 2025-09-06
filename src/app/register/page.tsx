
"use client";

import * as React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Leaf, UserPlus } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, writeBatch } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.16c1.56 0 2.95.55 4.06 1.6l3.16-3.16C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);


const createNewUserDocument = async (user: User, name: string | null) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
            name: name,
            email: user.email,
            role: 'user', // Default role
            createdAt: new Date(),
            points: 0,
            level: 1,
            badges: [],
        });
    }
}

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    
    if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "خطأ", description: "كلمتا المرور غير متطابقتين." });
        return;
    }
    if (password.length < 6) {
        toast({ variant: "destructive", title: "خطأ", description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." });
        return;
    }

    setIsLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });
        await createNewUserDocument(user, name);
        
        toast({
            title: "تم إنشاء الحساب بنجاح!",
            description: "يمكنك الآن تسجيل الدخول باستخدام حسابك الجديد.",
        });

        router.push('/login');

    } catch (error: any) {
        let description = "حدث خطأ ما أثناء إنشاء حسابك.";
        if (error.code === 'auth/email-already-in-use') {
            description = "هذا البريد الإلكتروني مستخدم بالفعل.";
        }
        toast({
            variant: "destructive",
            title: "خطأ في التسجيل",
            description: description,
        });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        await createNewUserDocument(user, user.displayName);
        
        toast({ title: "تم تسجيل الدخول بنجاح!" });
        router.push('/');
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "فشل تسجيل الدخول",
            description: "لم نتمكن من تسجيل دخولك باستخدام Google.",
        });
    } finally {
        setIsGoogleLoading(false);
    }
  }


  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
         <div className="inline-flex items-center gap-3 bg-primary/20 px-4 py-2 rounded-full mb-6">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-semibold text-primary-foreground">مزارع كويتي</span>
        </div>
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                    <UserPlus />
                    إنشاء حساب جديد
                </CardTitle>
                <CardDescription>
                    أدخل بياناتك لإنشاء حساب جديد.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">الاسم</Label>
                        <Input id="name" placeholder="أدخل اسمك..." value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <Input id="password" type="password" placeholder="اختر كلمة مرور قوية..." value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                        <Input id="confirmPassword" type="password" placeholder="أعد إدخال كلمة المرور..." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "جاري الإنشاء..." : "إنشاء الحساب"}
                    </Button>
                </form>
                <Separator className="my-6">أو</Separator>
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
                    {isGoogleLoading ? "جاري..." : <><GoogleIcon/> <span className="mx-2">إنشاء حساب باستخدام Google</span></> }
                 </Button>
            </CardContent>
             <CardFooter className="flex flex-col gap-4">
                <Separator />
                <p className="text-sm text-muted-foreground">
                    لديك حساب بالفعل؟{' '}
                    <NextLink href="/login" className="font-semibold text-primary hover:underline">
                        تسجيل الدخول
                    </NextLink>
                </p>
            </CardFooter>
        </Card>
      </div>
    </main>
  );
}

    