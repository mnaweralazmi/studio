"use client";

import * as React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { Leaf, LogIn } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAppContext } from '@/context/app-context';

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAppContext();
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);


  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful!" });
      // The redirect is handled by the useEffect hook
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Incorrect email or password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading || (!loading && user)) {
     return null; // Prevent flash of login page
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
                    <LogIn />
                    Login
                </CardTitle>
                <CardDescription>
                   Enter your credentials to access your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2 text-left">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                     <div className="space-y-2 text-left">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                            id="password"
                            type="password" 
                            placeholder="" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Logging in..." : "Login"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter>
                <p className="text-sm text-muted-foreground w-full text-center">
                    Don't have an account?{' '}
                    <NextLink href="/register" className="font-semibold text-primary hover:underline">
                        Create a new account
                    </NextLink>
                </p>
            </CardFooter>
        </Card>
      </div>
    </main>
  );
}
