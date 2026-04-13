"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setError("Enter a new password"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 4) { setError("Password must be at least 4 characters"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo-wrap">
            <h1 className="auth-title">Invalid Link</h1>
            <p className="auth-subtitle">This reset link is missing or malformed</p>
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link href="/forgot-password" style={{ color: "var(--primary)" }}>
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-subtitle">Enter your new password</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {!done ? (
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label className="field-label">New Password</label>
              <div className="input-row">
                <input
                  type={showPw ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <button type="button" className="toggle-vis" onClick={() => setShowPw(!showPw)}>
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Confirm Password</label>
              <input
                type={showPw ? "text" : "password"}
                className="input"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ fontSize: "2rem", marginBottom: 12 }}>✅</div>
            <p style={{ color: "var(--text-main)", fontWeight: 500, marginBottom: 8 }}>
              Password reset successful!
            </p>
            <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: "0.85rem" }}>
              You can now log in with your new password.
            </p>
            <button className="btn btn-primary btn-block" onClick={() => router.push("/login")}>
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="loading-page"><span className="spinner" /> Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
