"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DebtsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/expenses?tab=debts');
  }, [router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <p>...جاري التحويل إلى صفحة الديون</p>
    </div>
  );
}
