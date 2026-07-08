"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, Shield, KeyRound } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const [role, setRole] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Student OTP states
  const [step, setStep] = useState<"login" | "otp" | "adminkey">("login");
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Admin Key states
  const [adminKey, setAdminKey] = useState("");
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [adminKeyLoading, setAdminKeyLoading] = useState(false);
  const [adminKeyError, setAdminKeyError] = useState("");

  function startResendTimer() {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (role === "admin") {
      // Admin: signIn immediately (admin has separate key step after)
      const loginEmail = `admin_${username}@scholarhub.admin`;
      const res = await signIn("credentials", {
        email: loginEmail,
        password,
        redirect: false,
      });
      setLoading(false);

      if (!res) {
        setError("No response from server. Please try again.");
        return;
      }
      if (res.error) {
        setError(`Login failed: ${res.error}. Check username/password.`);
        return;
      }

      // Credentials correct — go to Admin Key step
      setStep("adminkey");
      return;
    }

    // Student — verify credentials WITHOUT creating a session
    const credRes = await fetch("/api/auth/verify-credentials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const credData = await credRes.json();

    if (!credData.valid) {
      setLoading(false);
      setError(credData.error || "Email or password is incorrect. Please register first.");
      return;
    }

    // Credentials correct — now send OTP (still no session yet)
    const otpRes = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);

    if (otpRes.ok) {
      setStep("otp");
      startResendTimer();
    } else {
      const data = await otpRes.json();
      setError(data.error || "OTP could not be sent");
    }
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError("");

    // Verify OTP first
    const res = await fetch(`/api/auth/send-otp?email=${encodeURIComponent(email)}&otp=${otp}`);
    const data = await res.json();

    if (!data.valid) {
      setOtpLoading(false);
      setOtpError(data.error || "Incorrect OTP. Please try again.");
      setOtp("");
      return;
    }

    // OTP correct — NOW create the session
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setOtpLoading(false);

    if (signInRes?.error) {
      setOtpError("Login failed. Please try again.");
      return;
    }

    // Wait for session cookie to be set, then redirect
    await new Promise(r => setTimeout(r, 500));
    window.location.href = "/";
  }

  async function handleResendOtp() {
    if (resendTimer > 0) return;
    setOtpError("");
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) { startResendTimer(); setOtpError("New OTP sent!"); }
    else setOtpError("Resend failed. Please try again.");
  }

  async function handleAdminKeyVerify(e: React.FormEvent) {
    e.preventDefault();
    setAdminKeyLoading(true);
    setAdminKeyError("");

    try {
      const res = await fetch("/api/auth/verify-admin-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: adminKey }),
      });
      const data = await res.json();
      setAdminKeyLoading(false);

      if (data.valid) {
        // Wait for session cookie to be set, then redirect
        await new Promise(r => setTimeout(r, 500));
        window.location.href = "/admin";
      } else {
        setAdminKeyError(data.error || "Invalid admin key. Check Vercel env: ADMIN_SECRET_KEY");
        setAdminKey("");
      }
    } catch {
      setAdminKeyLoading(false);
      setAdminKeyError("Server error. Please try again.");
    }
  }

  // ── OTP Step ──
  if (step === "otp") {
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
            <div className="flex justify-center mb-4">
              <div style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)", borderRadius: "50%", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mail size={28} color="white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Verify OTP</h2>
            <p className="text-gray-500 text-sm text-center mb-2">6-digit OTP sent to:</p>
            <p className="text-blue-600 font-semibold text-sm text-center mb-6">{email}</p>

            {otpError && (
              <div className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm mb-5 ${otpError.includes("sent") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
                <span className="mt-0.5 flex-shrink-0">{otpError.includes("sent") ? "✅" : "⚠️"}</span>
                <p>{otpError}</p>
              </div>
            )}

            <form onSubmit={handleOtpVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Enter OTP</label>
                <input type="text" required maxLength={6} value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="w-full py-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-center font-bold tracking-[12px] text-2xl" />
              </div>
              <button type="submit" disabled={otpLoading || otp.length !== 6}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#4f46e5)" }}>
                {otpLoading ? <><Loader2 className="animate-spin" size={16} /> Verifying...</> : "Verify & Login"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-sm text-gray-500 mb-2">Didn't receive OTP?</p>
              <button onClick={handleResendOtp} disabled={resendTimer > 0}
                className="text-blue-600 font-semibold text-sm hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed">
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </div>
            <div className="mt-4 text-center">
              <button onClick={() => { setStep("login"); setOtp(""); setOtpError(""); }}
                className="text-gray-400 text-xs hover:text-gray-600">← Go Back</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin Key Step ──
  if (step === "adminkey") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
              <GraduationCap className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">ScholarHub</h1>
            <p className="text-gray-500 mt-1 text-sm">Scholarship Portal — Gujarat & Central</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex justify-center mb-4">
              <div style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)", borderRadius: "50%", width: "64px", height: "64px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <KeyRound size={28} color="white" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center mb-1">Admin Key Required</h2>
            <p className="text-gray-500 text-sm text-center mb-1">Enter the secret admin key to</p>
            <p className="text-purple-600 font-semibold text-sm text-center mb-5">access the Admin Panel</p>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "#7c3aed" }}>✓</div>
                <span className="text-xs text-gray-400 font-medium">Credentials</span>
              </div>
              <div className="w-8 h-px bg-purple-200" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "#7c3aed" }}>2</div>
                <span className="text-xs text-purple-600 font-bold">Admin Key</span>
              </div>
            </div>

            {adminKeyError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm mb-5">
                <span className="mt-0.5 flex-shrink-0">⚠️</span>
                <p>{adminKeyError}</p>
              </div>
            )}

            <form onSubmit={handleAdminKeyVerify} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Secret Key</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type={showAdminKey ? "text" : "password"}
                    required
                    value={adminKey}
                    onChange={e => setAdminKey(e.target.value)}
                    placeholder="Enter admin secret key"
                    className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50 hover:bg-white transition-colors"
                  />
                  <button type="button" onClick={() => setShowAdminKey(!showAdminKey)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showAdminKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                   Fixed secret key — known only to authorized admins
                </p>
              </div>

              <button type="submit" disabled={adminKeyLoading || adminKey.length === 0}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg,#7c3aed,#6d28d9)" }}>
                {adminKeyLoading
                  ? <><Loader2 className="animate-spin" size={16} /> Verifying Key...</>
                  : <><Shield size={15} /> Verify & Enter Admin</>
                }
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              <button
                onClick={() => { setStep("login"); setAdminKey(""); setAdminKeyError(""); }}
                className="text-gray-400 text-xs hover:text-gray-600">
                ← Go Back
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            🛡️ Step 2 of 2 — Admin Authentication
          </p>
        </div>
      </div>
    );
  }

  // ── Main Login Step ──
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

          {/* Registration success banner */}
          {justRegistered && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 text-sm mb-5">
              <span className="mt-0.5 flex-shrink-0">✅</span>
              <p><strong>Account created successfully!</strong> Please login with your email and password.</p>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {role === "student" ? "Welcome back!" : "Admin Portal"}
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            {role === "student" ? "Secure OTP-based login" : "Restricted access — admins only"}
          </p>

          {/* Step indicator for admin */}
          {role === "admin" && (
            <div className="flex items-center justify-center gap-3 mb-5 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "#7c3aed" }}>1</div>
                <span className="text-xs text-purple-600 font-bold">Credentials</span>
              </div>
              <div className="w-8 h-px bg-purple-200" />
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-gray-200 text-gray-500">2</div>
                <span className="text-xs text-gray-400 font-medium">Admin Key</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm mb-5">
              <span className="mt-0.5 flex-shrink-0">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                ? <><Loader2 className="animate-spin" size={16} /> {role === "student" ? "Sending OTP..." : "Verifying..."}</>
                : role === "student" ? "Send OTP" : "Next →"
              }
            </button>
          </form>

          {role === "student" && (
            <div className="mt-6 pt-5 border-t border-gray-100 text-center space-y-3">
              <div>
                <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-blue-600 font-medium">
                  Forgot your password?
                </Link>
              </div>
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