"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setState("error"); setMessage("Invalid verification link."); return; }
    fetch(`/python/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) { setState("success"); setMessage(data.message); }
        else { setState("error"); setMessage(data.error || "Verification failed."); }
      })
      .catch(() => { setState("error"); setMessage("Something went wrong. Please try again."); });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="block font-bold text-xl text-[#1a1a1a] mb-8">
          Pari<span className="text-[#2d6a4f]">chaya</span>
        </Link>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          {state === "loading" && (
            <>
              <div className="w-10 h-10 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#6b7280]">Verifying your email…</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="w-12 h-12 rounded-full bg-[#2d6a4f] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Email verified!</h2>
              <p className="text-sm text-[#6b7280] mb-6">{message}</p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-2.5 rounded-full bg-[#1a1a1a] text-white text-sm font-semibold hover:bg-[#2d6a4f] transition-colors shadow-lg shadow-black/10"
              >
                Go to Dashboard
              </Link>
            </>
          )}

          {state === "error" && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-[#1a1a1a] mb-2">Verification failed</h2>
              <p className="text-sm text-[#6b7280] mb-6">{message}</p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-2.5 rounded-full border border-stone-200 text-sm font-semibold text-[#1a1a1a] hover:border-stone-300 hover:bg-stone-50 transition-all"
              >
                Back to Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf9f6] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
