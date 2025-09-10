
"use client";

import * as React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Leaf, LogIn, Eye, EyeOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAppContext } from '@/context/app-context';
import { useLanguage } from '@/context/language-context';


const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.16c1.56 0 2.95.55 4.06 1.6l3.16-3.16C17.45 1.99 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
)

const createNewUserDocument = async (user: User) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        return; 
    }

    await setDoc(userDocRef, {
        uid: user.uid,
        name: user.displayName || 'Anonymous User',
        email: user.email,
        role: 'user', 
        createdAt: new Date(),
        points: 0,
        level: 1,
        badges: [],
        photoURL: user.photoURL || ''
    });
}


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await createNewUserDocument(result.user);
      toast({ title: t('loginSuccess' as any) });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('loginFailed' as any),
        description: t('loginFailedDesc' as any),
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
        await createNewUserDocument(result.user);
        toast({ title: t('loginSuccess' as any) });
    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        let description = t('googleLoginFailedDesc' as any);
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
            description = t('popupClosedError' as any);
        }
        toast({
            variant: "destructive",
            title: t('loginFailed' as any),
            description: description,
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
            <span className="font-headline text-lg font-semibold text-primary">{t('kuwaitiFarmer')}</span>
        </div>
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                    <LogIn />
                    {t('login' as any, {})}
                </CardTitle>
                <CardDescription>
                   {t('loginDesc' as any, {})}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="space-y-2 text-left">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                     <div className="space-y-2 text-left">
                        <Label htmlFor="password">{t('password' as any, {})}</Label>
                        <div className="relative">
                            <Input 
                                id="password"
                                type={showPassword ? "text" : "password"} 
                                placeholder="" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-10" 
                                required
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-muted-foreground">
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                        {isLoading ? t('loggingIn' as any, {}) : t('login' as any, {})}
                    </Button>
                </form>
                 <Separator className="my-6">{t('or' as any, {})}</Separator>
                 <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
                    {isGoogleLoading ? t('loading') : <><GoogleIcon/> <span className="mx-2">{t('loginWithGoogle' as any, {})}</span></> }
                 </Button>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Separator />
                <p className="text-sm text-muted-foreground">
                    {t('noAccount' as any, {})}{' '}
                    <NextLink href="/register" className="font-semibold text-primary hover:underline">
                        {t('createAccount' as any, {})}
                    </NextLink>
                </p>
            </CardFooter>
        </Card>
      </div>
    </main>
  );
}
