import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Home, ListChecks, Tractor, Settings } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "مزرعتي",
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
      <body className={`${inter.className} bg-gray-50`}>
        <main className="pb-20">{children}</main>
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t">
          <nav className="flex justify-around items-center h-16">
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className="flex flex-col items-center justify-center text-gray-600 hover:text-green-600 w-full"
              >
                <item.icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
          </nav>
        </footer>
      </body>
    </html>
  );
}
