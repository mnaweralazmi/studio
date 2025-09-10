"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Briefcase, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/calendar", label: "التقويم", icon: Calendar },
  { href: "/management", label: "الإدارة", icon: Briefcase },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col pb-16">{children}</main>
      <footer className="fixed bottom-0 w-full bg-background border-t">
        <nav className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-sm font-medium w-1/4",
                pathname === href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}