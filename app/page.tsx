import Image from "next/image";
import { Droplets, BookOpen } from "lucide-react";

export default function HomePage() {
  const topics = [
    { title: "أفضل الممارسات للري", icon: Droplets },
    { title: "مكافحة الآفات بطرق عضوية", icon: BookOpen },
  ];

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          أهلاً بك في <span className="text-primary">مزرعتي</span>
        </h1>
        <p className="text-muted-foreground">
          دليلك التعليمي لاستدامة مزرعتك ونموها.
        </p>
      </header>

      <div className="relative h-52 w-full rounded-2xl overflow-hidden shadow-lg">
        <Image
          src="https://picsum.photos/seed/farm/800/400"
          alt="صورة مزرعة"
          fill
          style={{ objectFit: 'cover' }}
          data-ai-hint="farm landscape"
          className="brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex flex-col justify-end p-5">
          <h2 className="text-white text-2xl font-bold drop-shadow-md">
            أساسيات الزراعة الحديثة
          </h2>
          <p className="text-white/90 text-sm mt-1 drop-shadow-md">ابدأ رحلتك نحو زراعة ناجحة.</p>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-4 text-foreground">مواضيع شائعة</h3>
        <div className="grid grid-cols-1 gap-4">
          {topics.map((topic, index) => (
            <div
              key={index}
              className="bg-card p-4 rounded-xl shadow-sm flex items-center space-x-4 rtl:space-x-reverse transition-all hover:shadow-md hover:bg-secondary cursor-pointer"
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