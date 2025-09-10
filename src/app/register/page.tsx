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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAppContext } from '@/context/app-context';


export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAppContext();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');

  React.useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);


  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    
    if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
        return;
    }
    if (password.length < 6) {
        toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters." });
        return;
    }

    setIsSubmitting(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        await updateProfile(newUser, { displayName: name });
        
        // Create user document in Firestore
        const userDocRef = doc(db, "users", newUser.uid);
        await setDoc(userDocRef, {
            uid: newUser.uid,
            name: name,
            email: newUser.email,
            createdAt: new Date(),
        });
        
        toast({
            title: "Account Created",
            description: "You can now log in.",
        });

        router.push('/login');

    } catch (error: any) {
        let description = "An error occurred while creating your account.";
        if (error.code === 'auth/email-already-in-use') {
            description = "This email is already in use.";
        }
        toast({
            variant: "destructive",
            title: "Registration Failed",
            description: description,
        });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || (!loading && user)) {
     return null; // Prevent flash of register page
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
         <div className="inline-flex items-center gap-3 bg-primary/20 px-4 py-2 rounded-full mb-6">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-semibold text-primary">Kuwaiti Farmer</span>
        </div>
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2">
                    <UserPlus />
                    Create Account
                </CardTitle>
                <CardDescription>
                    Enter your details to create a new account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2 text-left">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
                     <div className="space-y-2 text-left">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                     <div className="space-y-2 text-left">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" type="password" placeholder="Choose a strong password..." value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                     <div className="space-y-2 text-left">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input id="confirmPassword" type="password" placeholder="Re-enter your password..." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Creating account..." : "Create Account"}
                    </Button>
                </form>
            </CardContent>
             <CardFooter>
                <p className="text-sm text-muted-foreground w-full text-center">
                    Already have an account?{' '}
                    <NextLink href="/login" className="font-semibold text-primary hover:underline">
                        Login
                    </NextLink>
                </p>
            </CardFooter>
        </Card>
      </div>
    </main>
  );
}
