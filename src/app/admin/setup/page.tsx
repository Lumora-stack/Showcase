"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function SetupAdminPage() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetup = async () => {
    setLoading(true);
    setStatus("Registering credentials in Firebase Auth...");
    try {
      await createUserWithEmailAndPassword(
        auth,
        "quantumvoyager2005@gmail.com",
        "StephanSalvatore"
      );
      setStatus("Success! Admin user registered. Redirecting to login...");
      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setStatus("This email is already registered. Redirecting to login...");
        setTimeout(() => {
          router.push("/admin/login");
        }, 2000);
      } else {
        setStatus(`Setup failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full glass border border-zinc-800 p-8 rounded-2xl text-center flex flex-col gap-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Initialize Admin Account</h1>
          <p className="text-zinc-550 text-xs mt-1.5 leading-relaxed">
            Click below to register the admin email <strong className="text-indigo-400">quantumvoyager2005@gmail.com</strong> in your Firebase project.
          </p>
        </div>

        {status && (
          <div className="p-3.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium">
            {status}
          </div>
        )}

        <button
          onClick={handleSetup}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Register Admin Credentials
        </button>
      </div>
    </div>
  );
}
