// src/components/TestFetchClient.tsx
"use client";
import React, { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase"; // تم تعديل المسار ليتوافق مع مشروعك
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

export default function TestFetchClient() {
  const [status, setStatus] = useState("starting...");
  useEffect(() => {
    (async () => {
      try {
        // Wait for auth to initialize
        await new Promise(resolve => {
            const unsubscribe = auth.onAuthStateChanged(user => {
                if (user) {
                    resolve(user);
                } else {
                    setStatus("auth.currentUser is null. Please sign in first.");
                    resolve(null);
                }
                unsubscribe();
            });
        });

        const user = auth.currentUser;
        if (!user) {
          return;
        }
        
        setStatus("auth.currentUser: " + user.uid);
        
        // 1) جلب مستند المستخدم
        setStatus(s => s + " | Fetching user doc...");
        const userSnap = await getDoc(doc(db, "users", user.uid));
        console.log("DEBUG userDoc snap:", userSnap.exists() ? userSnap.data() : null);
        setStatus((s) => s + ` | userDoc.exists=${userSnap.exists()}`);

        // 2) جلب ساب-كلكشن workers كمثال
        setStatus(s => s + " | Fetching users/{uid}/workers ...");
        const workersSnap = await getDocs(collection(db, "users", user.uid, "workers"));
        console.log("DEBUG workers:", workersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setStatus((s) => s + ` | workersCount=${workersSnap.size}`);

      } catch (err: any) {
        console.error("FETCH ERROR:", err);
        setStatus("ERROR: " + (err?.message || String(err)));
      }
    })();
  }, []);

  return (
    <div style={{ position: "fixed", bottom: 12, left: 12, zIndex: 9999, background: "#000000cc", color: "white", padding: 10, borderRadius: 8, maxWidth: '90vw' }}>
      <div style={{ fontWeight: 'bold' }}>TestFetch</div>
      <div style={{ fontSize: 13, wordBreak: 'break-all' }}>{status}</div>
    </div>
  );
}
