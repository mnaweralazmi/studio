import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AppFooter from "@/components/AppFooter";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "مزارع كويتي",
  description: "إدارة المزرعة بسهولة",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${tajawal.className} bg-background`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="pb-24 pt-4 px-4">{children}</main>
          <AppFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
