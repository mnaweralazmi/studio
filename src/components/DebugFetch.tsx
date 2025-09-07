// src/components/DebugFetch.tsx

"use client";

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { fetchUserDoc, fetchUserSubcollection } from '@/lib/api/user-db';

export function DebugFetch() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = React.useState("التحقق من المصادقة...");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) {
      return; // انتظر انتهاء تحميل المصادقة
    }

    if (!user) {
      setStatus("فشل: المستخدم غير مسجل الدخول.");
      return;
    }

    const runTests = async () => {
      try {
        setStatus("جاري جلب بيانات المستخدم...");
        console.log("UID:", user.uid);

        // Test 1: Fetch user document
        const userDoc = await fetchUserDoc(user.uid);
        console.log("User Doc:", userDoc);
        if (!userDoc) {
          throw new Error("لم يتم العثور على مستند المستخدم.");
        }
        setStatus("نجح جلب مستند المستخدم. جاري جلب العمال...");

        // Test 2: Fetch 'workers' subcollection
        const workersCollection = await fetchUserSubcollection("workers", user.uid);
        console.log("Workers Collection:", workersCollection);
        setStatus(`نجاح! تم جلب ${workersCollection.length} عامل.`);

      } catch (e: any) {
        console.error("### خطأ في الفحص السريع ###", e);
        setError(e.message);
        setStatus("فشل الفحص. تحقق من الـ Console.");
      }
    };

    runTests();

  }, [user, authLoading]);

  return (
    <div style={{ padding: '20px', margin: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>فحص جلب البيانات من Firestore</h3>
      <p><strong>الحالة:</strong> {status}</p>
      {error && <p style={{ color: 'red' }}><strong>خطأ:</strong> {error}</p>}
    </div>
  );
}
