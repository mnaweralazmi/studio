// src/components/TestFetchClient.tsx
"use client";
import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { fetchUserDoc, fetchUserSubcollection } from "@/lib/api/user-db";


export default function TestFetchClient() {
  const [status, setStatus] = useState("starting test...");

  useEffect(() => {
    const runTest = async () => {
        // انتظر حتى تتم تهيئة المصادقة
        await new Promise(resolve => {
            const unsubscribe = auth.onAuthStateChanged(user => {
                resolve(user);
                unsubscribe();
            });
        });

        const user = auth.currentUser;
        console.log("UID:", user?.uid);
        setStatus("auth.currentUser: " + (user ? user.uid : "null"));
        
        if (!user) {
          setStatus((s) => s + "  -> Not signed in. Please sign in first.");
          return;
        }

        try {
            // 1) جلب مستند المستخدم
            setStatus(s => s + " | Fetching user doc...");
            const userDoc = await fetchUserDoc();
            console.log("DEBUG userDoc:", userDoc);
            setStatus((s) => s + ` | userDoc.exists=${!!userDoc}`);

            // 2) جلب ساب-كلكشن workers كمثال
            setStatus(s => s + " | Fetching users/{uid}/workers...");
            const workersCollection = await fetchUserSubcollection("workers");
            console.log("DEBUG workers:", workersCollection);
            setStatus((s) => s + ` | workersCount=${workersCollection.length}`);
            setStatus(s => s + " | Test Finished.");

        } catch (err: any) {
            console.error("FETCH ERROR:", err);
            setStatus("ERROR: " + (err?.message || String(err)));
        }
    };

    runTest();
  }, []);

  return (
    <div style={{ position: "fixed", bottom: 12, left: 12, zIndex: 9999, background: "#000000cc", color: "white", padding: 10, borderRadius: 8, maxWidth: '90vw' }}>
      <div style={{ fontWeight: 'bold' }}>TestFetch</div>
      <div style={{ fontSize: 13, wordBreak: 'break-all' }}>{status}</div>
    </div>
  );
}
