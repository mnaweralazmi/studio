import AppLayout from "@/components/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const topics = [
  { title: "أساسيات الزراعة", description: "تعلم المبادئ الأولى للزراعة الناجحة." },
  { title: "مكافحة الآفات", description: "استراتيجيات طبيعية وكيميائية لحماية محاصيلك." },
  { title: "التسميد والري", description: "أفضل الممارسات لتغذية النباتات وسقيها." },
  { title: "زراعة الخضروات", description: "دليل شامل لزراعة أشهر أنواع الخضروات." },
];

export default function HomePage() {
  return (
    <AppLayout>
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">مواضيع للتعليم</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <Card key={topic.title}>
              <CardHeader>
                <CardTitle>{topic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{topic.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
