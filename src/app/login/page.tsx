"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"OTP" | "PASSWORD">("PASSWORD");

  // Password login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  // OTP login state
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---- Password Login ---- */
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push(data.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---- OTP Send ---- */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Enter your email address"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpSent(true);
      if (data.mockedOtp) {
        alert(`Your OTP (testing mode): ${data.mockedOtp}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---- OTP Verify ---- */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      router.push(data.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-wrap">
          <img
            src="/logo.png"
            alt="Logo"
            className="auth-logo"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <h1 className="auth-title">Robomanthan</h1>
          <p className="auth-subtitle">Component Management Portal</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${tab === "PASSWORD" ? "active" : ""}`}
            onClick={() => { setTab("PASSWORD"); setError(""); }}
          >
            Password
          </button>
          <button
            className={`tab ${tab === "OTP" ? "active" : ""}`}
            onClick={() => { setTab("OTP"); setError(""); }}
          >
            Email &amp; OTP
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* PASSWORD TAB */}
        {tab === "PASSWORD" && (
          <form onSubmit={handlePasswordLogin} className="form">
            <div className="field">
              <label className="field-label">Username</label>
              <input
                type="text"
                className="input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <div className="input-row">
                <input
                  type={showPw ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-vis"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <Link href="/forgot-password" style={{ color: "var(--text-muted)", fontSize: "0.83rem" }}>
                Forgot password?
              </Link>
            </div>
          </form>
        )}

        {/* OTP TAB */}
        {tab === "OTP" && (
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="form">
              <div className="field">
                <label className="field-label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? "Sending…" : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="form">
              <div className="field">
                <label className="field-label">Enter 6-digit OTP sent to {email}</label>
                <input
                  type="text"
                  className="input"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? "Verifying…" : "Verify & Sign In"}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => { setOtpSent(false); setOtp(""); setError(""); }}
              >
                ← Back
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
