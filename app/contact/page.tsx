"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, CheckCircle2, Loader2 } from "lucide-react";

export default function ContactPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send message"); setLoading(false); return; }
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 px-4">
      <div className="max-w-xl mx-auto">

        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 font-semibold text-sm">
          <ArrowLeft size={18} /> Back
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>
              💬
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
              <p className="text-gray-500 text-sm">We'll get back to you within 24 hours</p>
            </div>
          </div>

          {sent ? (
            <div className="text-center py-10">
              <CheckCircle2 className="mx-auto text-green-500 mb-4" size={56} />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h2>
              <p className="text-gray-500 text-sm mb-6">Thank you for reaching out. We'll respond to your query soon.</p>
              <button onClick={() => setSent(false)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                <textarea required rows={5} value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  placeholder="Write your query or message here..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none" />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>
                {loading ? <><Loader2 className="animate-spin" size={16} /> Sending...</> : <><Send size={16} /> Send Message</>}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
