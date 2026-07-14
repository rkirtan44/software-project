"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, Shield } from "lucide-react";

function LoginForm() {
  const searchParams  = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [role, setRole]       = useState<"student" | "admin">("student");
  const [email, setEmail]     = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Build the email used for NextAuth credentials
    const loginEmail = role === "admin"
      ? `admin_${username}@scholarhub.admin`
      : email;

    const res = await signIn("credentials", {
      email: loginEmail,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Email or password is incorrect.");
      return;
    }

    // Redirect based on role
    window.location.href = role === "admin" ? "/admin" : "/";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>
            <GraduationCap className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ScholarPath</h1>
          <p className="text-gray-500 mt-1 text-sm">Scholarship Portal</p>
        </div>

        {/* Role Toggle */}
        <div className="flex rounded-2xl overflow-hidden border border-gray-200 mb-6 bg-white shadow-sm">
          <button onClick={() => { setRole("student"); setError(""); }}
            className={`flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${role === "student" ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
            style={role === "student" ? { background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" } : {}}>
            🎓 Student Login
          </button>
          <button onClick={() => { setRole("admin"); setError(""); }}
            className={`flex-1 py-3 text-sm font-bold transition-all flex items-center justify-center gap-2 ${role === "admin" ? "text-white" : "text-gray-500 hover:bg-gray-50"}`}
            style={role === "admin" ? { background: "linear-gradient(135deg,#7c3aed,#6d28d9)" } : {}}>
            <Shield size={14} /> Admin Login
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">

          {/* Registration success */}
          {justRegistered && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 text-sm mb-5">
              <span className="mt-0.5 flex-shrink-0">✅</span>
              <p><strong>Account created!</strong> Please login with your email and password.</p>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {role === "student" ? "Welcome back!" : "Admin Portal"}
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            {role === "student" ? "Login with your email and password" : "Restricted access — admins only"}
          </p>

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm mb-5">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email / Username */}
            {role === "student" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="email" required value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Username</label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" required value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="admin username"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 hover:bg-white transition-colors" />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type={showPass ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 hover:bg-white transition-colors" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: role === "admin" ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>
              {loading
                ? <><Loader2 className="animate-spin" size={16} /> Logging in...</>
                : "Login"
              }
            </button>
          </form>

          {role === "student" && (
            <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-3">
              <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-blue-600 font-medium">
                Forgot your password?
              </Link>
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700">Create account</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
