import Image from "next/image";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          أهلاً بك في <span className="text-primary">مزرعتي</span>
        </h1>
        <p className="text-muted-foreground">
          دليلك التعليمي لاستدامة مزرعتك ونموها.
        </p>
      </header>

      <div className="relative h-48 w-full rounded-xl overflow-hidden shadow-lg">
        <Image
          src="https://picsum.photos/seed/farm/800/400"
          alt="صورة مزرعة"
          fill
          style={{ objectFit: 'cover' }}
          data-ai-hint="farm landscape"
        />
        <div className="absolute inset-0 bg-black/30 flex items-end p-4">
          <h2 className="text-white text-xl font-bold">
            أساسيات الزراعة الحديثة
          </h2>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3 text-foreground">مواضيع شائعة</h3>
        <div className="space-y-3">
          <div className="bg-card p-4 rounded-lg shadow-sm flex items-center space-x-4 rtl:space-x-reverse">
            <div className="bg-primary/20 p-2 rounded-md">
              <span className="text-primary font-bold">١</span>
            </div>
            <p className="text-card-foreground font-medium">
              أفضل الممارسات للري
            </p>
          </div>
          <div className="bg-card p-4 rounded-lg shadow-sm flex items-center space-x-4 rtl:space-x-reverse">
            <div className="bg-primary/20 p-2 rounded-md">
              <span className="text-primary font-bold">٢</span>
            </div>
            <p className="text-card-foreground font-medium">
              مكافحة الآفات بطرق عضوية
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
