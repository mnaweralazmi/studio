
"use client";

import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, getDocs, onSnapshot, query, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase"; // تأكد من المسار
// لا تعتمد على useAuth هنا — نتحقق مباشرة من SDK للتشخيص

export default function FirestoreDebugTest({ collectionName = "sales" }: { collectionName?: string }) {
  const [uid, setUid] = useState<string | null>(null);
  const [getDocsResult, setGetDocsResult] = useState<any>(null);
  const [snapshotResult, setSnapshotResult] = useState<any>(null);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const auth = getAuth();
    const current = auth.currentUser;
    console.log("[debug] firebase auth currentUser:", current);
    setUid(current ? current.uid : null);
  }, []);

  useEffect(() => {
    console.log("[debug] db object:", db);
  }, []);

  useEffect(() => {
    if (!uid) return;

    const q = query(collection(db, "users", uid, collectionName));

    // 1) Try getDocs once
    (async () => {
      try {
        const snap = await getDocs(q);
        console.log(`[debug] getDocs (${collectionName}) size=`, snap.size);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setGetDocsResult(docs);
      } catch (err: any) {
        console.error("[debug] getDocs error:", err);
        setErrors(prev => [...prev, `getDocs error: ${err?.message || err}`]);
        setGetDocsResult(null);
      }
    })();

    // 2) Try onSnapshot
    const unsub = onSnapshot(q, (snap) => {
      console.log(`[debug] onSnapshot (${collectionName}) size=`, snap.size);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSnapshotResult(docs);
    }, (err) => {
      console.error("[debug] onSnapshot error:", err);
      setErrors(prev => [...prev, `onSnapshot error: ${err?.message || err}`]);
      setSnapshotResult(null);
    });

    return () => { try { unsub(); } catch(e){} };
  }, [uid, collectionName]);

  return (
    <div style={{ padding: 16, border: "2px dashed #666", margin: 12 }}>
      <h3>Firestore Debug Test — collection: users/&lt;uid&gt;/{collectionName}</h3>
      <div><strong>Detected UID:</strong> {uid ?? <span style={{color:'red'}}>null (user not logged in)</span>}</div>

      <h4>getDocs result</h4>
      <pre>{getDocsResult ? JSON.stringify(getDocsResult, null, 2) : "— no data / errored —"}</pre>

      <h4>onSnapshot latest</h4>
      <pre>{snapshotResult ? JSON.stringify(snapshotResult, null, 2) : "— no data / errored —"}</pre>

      <h4>Errors</h4>
      <ul>
        {errors.length === 0 ? <li>none</li> : errors.map((e, i) => <li key={i} style={{color:'red'}}>{e}</li>)}
      </ul>

      <p>افتح Console و Network و ابحث عن رسائل `permission-denied` أو أخطاء أخرى.</p>
    </div>
  );
}
