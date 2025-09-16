'use client';
import { Megaphone } from 'lucide-react';

const ads = [
  'خصم 20% على جميع أنواع الأسمدة العضوية! لا تفوت الفرصة.',
  'ندوة زراعية عن أحدث تقنيات الزراعة المائية يوم السبت القادم.',
  'متوفر الآن: شتلات طماطم كرزية مقاومة للأمراض.',
  'هل تبحث عن عمالة مدربة؟ تواصل معنا للمساعدة.',
  'خدمات تنسيق الحدائق والمزارع بأسعار تنافسية.',
];

export default function AdMarquee() {
  const marqueeContent = [...ads, ...ads]; // Duplicate content for seamless loop

  return (
    <section className="relative flex overflow-hidden border-y bg-accent/50 text-accent-foreground py-3 my-8">
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
