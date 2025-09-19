'use client';
import { Megaphone, Loader2 } from 'lucide-react';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdMarquee() {
  const [snapshot, loading, error] = useDocument(doc(db, 'siteContent', 'adMarquee'));
  
  const ads = snapshot?.data()?.ads || [];
  const hasAds = ads.length > 0;

  if (loading) {
    return (
       <div className="relative flex items-center justify-center overflow-hidden border-y bg-accent/50 text-accent-foreground py-3 my-4 h-12">
         <Loader2 className="h-6 w-6 animate-spin text-primary" />
       </div>
    )
  }
  
  if (!hasAds || error) {
    return null; // Don't render the component if there are no ads or an error occurs
  }

  // Duplicate ads for a seamless loop
  const marqueeContent = [...ads, ...ads];

  return (
    <section className="relative flex overflow-hidden border-y bg-accent/50 text-accent-foreground py-3 my-4">
      <div className="absolute inset-y-0 left-0 z-10 flex items-center bg-background pr-4 pl-2">
        <Megaphone className="h-6 w-6 text-primary" />
      </div>
      <div className="flex animate-marquee whitespace-nowrap pl-12">
        {marqueeContent.map((ad, index) => (
          <span key={index} className="mx-8 text-sm font-medium">
            {ad}
          </span>
        ))}
      </div>
       <div className="absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
    </section>
  );
}
