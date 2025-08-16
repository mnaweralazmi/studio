import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf, Droplets, Bug, Scissors, Sprout, FlaskConical } from 'lucide-react';
import { WateringScheduleGenerator } from '@/components/watering-schedule-generator';

export default function Home() {
  const agriculturalSections = [
    {
      title: 'الري',
      icon: Droplets,
      content: 'الماء هو سر الحياة لجميع النباتات. يعتمد الري الصحيح على نوع النبات، حجمه، نوع التربة، والموسم. من المهم التأكد من عدم الإفراط في الري أو التقصير فيه، حيث أن كليهما يمكن أن يضر بالجذور.',
    },
    {
      title: 'الآفات والأمراض',
      icon: Bug,
      content: 'تعتبر الآفات والأمراض من أكبر التحديات في الزراعة. تشمل الآفات الشائعة حشرات المن، والعناكب الحمراء، والذباب الأبيض. يمكن مكافحتها باستخدام طرق طبيعية أو مبيدات حشرية مخصصة.',
    },
    {
      title: 'التقليم',
      icon: Scissors,
      content: 'التقليم هو عملية إزالة أجزاء من النبات لتحسين صحته، شكله، وإنتاجيته. يساعد التقليم على إزالة الأفرع الميتة أو المريضة، زيادة تدفق الهواء، وتشجيع نمو جديد.',
    },
    {
      title: 'الزراعة الداخلية والخارجية',
      icon: Sprout,
      content: 'تختلف متطلبات النباتات الداخلية عن النباتات الخارجية بشكل كبير. تحتاج النباتات الخارجية إلى التكيف مع تقلبات الطقس، بينما تحتاج النباتات الداخلية إلى إضاءة ورطوبة صناعية مناسبة.',
    },
    {
      title: 'المبيدات والأسمدة',
      icon: FlaskConical,
      content: 'تستخدم المبيدات لمكافحة الآفات والأمراض، بينما تستخدم الأسمدة لتزويد التربة بالعناصر الغذائية التي تحتاجها النباتات للنمو. يجب استخدام كلاهما بحذر ووفقًا للتعليمات لضمان سلامة النبات والبيئة.',
    },
  ];
  return (
    <main className="flex flex-1 flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 bg-primary/20 px-4 py-2 rounded-full">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg font-semibold text-primary-foreground">مزارع كويتي</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold font-headline text-foreground tracking-tight">
            دليلك الزراعي في الكويت
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-body">
            كل ما تحتاجه من معلومات حول الزراعة، الري، الآفات، والتقليم في مكان واحد.
          </p>
        </header>

        <WateringScheduleGenerator />

        <Card className="w-full max-w-4xl shadow-lg bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-3">
                <Leaf className="h-6 w-6 text-primary" />
                <span>دليلك الزراعي الشامل</span>
              </div>
            </CardTitle>
            <CardDescription>
              تصفح الأقسام أدناه لمعرفة المزيد عن كل جانب من جوانب العناية بالنباتات.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {agriculturalSections.map((section, index) => (
                <AccordionItem value={`item-${index + 1}`} key={index}>
                  <AccordionTrigger className="text-lg font-semibold">
                    <div className="flex items-center gap-3">
                      <section.icon className="h-5 w-5 text-primary" />
                      {section.title}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground font-body pr-8">
                    {section.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <footer className="text-center mt-12 text-sm text-muted-foreground font-body">
            <p>&copy; {new Date().getFullYear()} مزارع كويتي. صُنع بحب لكل ما هو أخضر.</p>
        </footer>
      </div>
    </main>
  );
}
