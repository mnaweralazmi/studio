import { Droplets, BookOpen } from "lucide-react";

export default function HomePage() {
  const topics = [
    { title: "أفضل الممارسات للري", icon: Droplets },
    { title: "مكافحة الآفات بطرق عضوية", icon: BookOpen },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-primary">
          مزارع كويتي
        </h1>
        <p className="text-muted-foreground">
          دليلك التعليمي لاستدامة مزرعتك ونموها.
        </p>
      </header>

      <div>
        <h3 className="text-2xl font-semibold mb-4 text-foreground">مواضيع شائعة</h3>
        <div className="grid grid-cols-1 gap-4">
          {topics.map((topic, index) => (
            <div
              key={index}
              className="bg-card p-4 rounded-xl shadow-sm flex items-center space-x-4 rtl:space-x-reverse transition-all hover:shadow-lg hover:scale-105 hover:-translate-y-1 cursor-pointer duration-300"
            >
              <div className="bg-primary/10 p-3 rounded-full">
                <topic.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-card-foreground font-medium text-base flex-1">
                {topic.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
