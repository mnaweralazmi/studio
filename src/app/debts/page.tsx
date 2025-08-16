"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DebtsPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/expenses?tab=debts');
  }, [router]);

  return null;
}
