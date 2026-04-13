"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/users/profile");
      if (res.status === 401) { router.push("/login"); return; }
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setEmail(data.user.email || "");
        setPhone(data.user.phoneNumber || "");
      }
    } catch {
      setError("Failed to load profile");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const payload: any = { email: email || null, phoneNumber: phone || null };
      if (newPassword && currentPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      } else if (newPassword || currentPassword) {
        throw new Error("Both current and new password are required");
      }

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setMessage("Profile updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      fetchProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div className="loading-page"><span className="spinner" /> Loading…</div>;

  return (
    <>
      <Navbar role={profile.role} />
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-subtitle">Manage your account and security settings</p>
          </div>
          <span className={`badge ${profile.role === "ADMIN" ? "badge-violet" : "badge-blue"}`}>
            {profile.role}
          </span>
        </div>

        <div style={{ maxWidth: 560 }}>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 className="card-title">Account Details</h3>
            <p className="card-desc" style={{ marginBottom: 20 }}>Your personal information</p>
            
            <form onSubmit={handleUpdate} className="form">
              <div className="field">
                <label className="field-label">Username</label>
                <input type="text" className="input" value={profile.username} disabled />
              </div>

              <div className="field">
                <label className="field-label">Email (for OTP Login)</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                />
              </div>

              <div className="field">
                <label className="field-label">Phone Number</label>
                <input
                  type="tel"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>

              <hr className="divider" />

              <h3 className="card-title" style={{ fontSize: "1rem" }}>Change Password</h3>
              <p className="card-desc" style={{ marginBottom: 12 }}>Leave blank to keep current password</p>

              <div className="field">
                <label className="field-label">Current Password</label>
                <input
                  type={showPw ? "text" : "password"}
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>

              <div className="field">
                <label className="field-label">New Password</label>
                <div className="input-row">
                  <input
                    type={showPw ? "text" : "password"}
                    className="input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="toggle-vis" onClick={() => setShowPw(!showPw)}>
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
