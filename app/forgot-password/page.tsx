"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Mail, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); setLoading(false); return; }
      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>
            <GraduationCap className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ScholarHub</h1>
          <p className="text-gray-500 mt-1 text-sm">Scholarship Portal — Gujarat & Central</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="mx-auto text-green-500 mb-4" size={56} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-500 text-sm mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-blue-600 font-semibold text-sm mb-6">{email}</p>
              <p className="text-gray-400 text-xs mb-6">
                Link expires in 1 hour. Check your spam folder if not received.
              </p>
              <Link href="/login"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your registered email and we'll send you a reset link.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>
                  {loading ? <><Loader2 className="animate-spin" size={16} /> Sending...</> : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <Link href="/login" className="flex items-center justify-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700">
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
