"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Enter your email address"); return; }
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      setSent(true);
      // If mocked, show the link
      if (data.resetUrl) {
        setMessage(`Reset link (test mode): ${data.resetUrl}`);
      }
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
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">We&apos;ll send a reset link to your email</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success" style={{ wordBreak: "break-all" }}>{message}</div>}

        {!sent ? (
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label className="field-label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>
              Check your inbox for the reset link.
            </p>
            <button className="btn btn-secondary btn-block" onClick={() => { setSent(false); setMessage(""); }}>
              Send Again
            </button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link href="/login" style={{ color: "var(--primary)", fontSize: "0.85rem" }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
