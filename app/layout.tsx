import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Home, ListChecks, Tractor, Settings, Wallet } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "مزارع كويتي",
  description: "إدارة المزرعة بسهولة",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/tasks", label: "المهام", icon: ListChecks },
    { href: "/management", label: "الإدارة", icon: Tractor },
    { href: "/settings", label: "الإعدادات", icon: Settings },
  ];

  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.className} bg-background`}>
        <main className="pb-24 pt-4 px-4">{children}</main>
        <footer className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-t-strong">
          <nav className="flex justify-around items-center h-20">
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors w-full h-full"
              >
                <item.icon className="h-7 w-7" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </footer>
      </body>
    </html>
  );
}
