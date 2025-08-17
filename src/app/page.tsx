
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Droplets, Bug, Scissors, Sprout, FlaskConical, PlayCircle } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const agriculturalSections = [
    {
      title: 'الري',
      icon: Droplets,
      description: 'تعلم أفضل الممارسات لسقي نباتاتك لضمان نمو صحي وتجنب الإفراط في الري أو نقصه.',
      image: 'https://placehold.co/600x400.png',
      hint: 'watering plants'
    },
    {
      title: 'الآفات والأمراض',
      icon: Bug,
      description: 'اكتشف كيفية التعرف على الآفات والأمراض الشائعة وطرق الوقاية والمكافحة الفعالة.',
      image: 'https://placehold.co/600x400.png',
      hint: 'plant pest'
    },
    {
      title: 'التقليم',
      icon: Scissors,
      description: 'أتقن فن التقليم لتحسين صحة النبات، تشجيع النمو الجديد، وزيادة إنتاج الثمار والأزهار.',
      image: 'https://placehold.co/600x400.png',
      hint: 'pruning shears'
    },
    {
      title: 'التربة والتسميد',
      icon: Sprout,
      description: 'فهم أنواع التربة المختلفة وكيفية اختيار الأسمدة المناسبة لتغذية نباتاتك بشكل مثالي.',
      image: 'https://placehold.co/600x400.png',
      hint: 'soil fertilizer'
    },
  ];

  const videoSections = [
    {
      title: 'دورة أساسيات الزراعة المنزلية',
      duration: '45 دقيقة',
      image: 'https://placehold.co/1600x900.png',
      hint: 'gardening tools'
    },
    {
      title: 'كيفية زراعة الطماطم بنجاح',
      duration: '15 دقيقة',
      image: 'https://placehold.co/1600x900.png',
      hint: 'tomato plant'
    },
    {
      title: 'صنع السماد العضوي في المنزل',
      duration: '20 دقيقة',
      image: 'https://placehold.co/1600x900.png',
      hint: 'compost pile'
    }
  ];

  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center gap-16">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/20 px-4 py-2 rounded-full">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-semibold text-primary-foreground">مزارع كويتي</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
            بوابتك لعالم الزراعة
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
            اكتشف مقالات وفيديوهات ونصائح الخبراء لمساعدتك في كل خطوة من رحلتك الزراعية.
          </p>
        </header>

        <section className="w-full">
            <h2 className="text-3xl font-bold text-center mb-8">المواضيع الزراعية</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {agriculturalSections.map((section) => (
                    <Card key={section.title} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="p-0">
                             <Image src={section.image} alt={section.title} width={600} height={400} className="w-full h-48 object-cover" data-ai-hint={section.hint} />
                        </CardHeader>
                        <CardContent className="p-6">
                            <CardTitle className="flex items-center gap-2 mb-2">
                                <section.icon className="h-6 w-6 text-primary" />
                                <span>{section.title}</span>
                            </CardTitle>
                            <p className="text-muted-foreground">{section.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>

        <section className="w-full">
            <h2 className="text-3xl font-bold text-center mb-8">فيديوهات تعليمية</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {videoSections.map((video) => (
                <Card key={video.title} className="overflow-hidden group cursor-pointer shadow-lg">
                    <div className="relative">
                        <Image src={video.image} alt={video.title} width={1600} height={900} className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" data-ai-hint={video.hint} />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <PlayCircle className="h-16 w-16 text-white/80 group-hover:text-white transition-colors"/>
                        </div>
                    </div>
                    <CardContent className="p-4">
                        <h3 className="font-semibold text-lg">{video.title}</h3>
                        <p className="text-sm text-muted-foreground">{video.duration}</p>
                    </CardContent>
                </Card>
              ))}
            </div>
        </section>

        <footer className="text-center mt-8 text-sm text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} مزارع كويتي. صُنع بحب لكل ما هو أخضر.</p>
        </footer>
      </div>
    </main>
  );
}
