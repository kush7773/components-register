"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface User {
  id: number;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  role: string;
  _count: { transactions: number };
}

export default function ManageUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // New user form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 401 || res.status === 403) { router.push("/login"); return; }
      if (res.ok) setUsers((await res.json()).users);
      setReady(true);
    } catch {
      setError("Failed to load users");
      setReady(true);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, email: userEmail || undefined, phoneNumber: phone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`Account "${username}" created as ${role}`);
      setUsername("");
      setPassword("");
      setUserEmail("");
      setPhone("");
      setRole("EMPLOYEE");
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete "${u.username}"? This will also remove their transaction history.`)) return;
    setDeletingId(u.id);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`"${u.username}" has been removed`);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (!ready) return <div className="loading-page"><span className="spinner" /> Loading…</div>;

  return (
    <>
      <Navbar role="ADMIN" />
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="page-title">Manage Users</h1>
            <p className="page-subtitle">Create and view admin &amp; employee accounts</p>
          </div>
          <span className="badge badge-violet">ADMIN</span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="grid-sidebar" style={{ marginBottom: "1.5rem" }}>
          {/* Create User Form */}
          <div className="card">
            <h3 className="card-title">Create Account</h3>
            <p className="card-desc" style={{ marginBottom: 20 }}>Add a new team member</p>

            <form onSubmit={handleCreate} className="form">
              <div className="field">
                <label className="field-label">Username</label>
                <input
                  type="text"
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ravi_kumar"
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">Password</label>
                <input
                  type="text"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Initial password"
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">Email (for OTP login)</label>
                <input
                  type="email"
                  className="input"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="user@company.com"
                />
              </div>
              <div className="field">
                <label className="field-label">Phone (optional)</label>
                <input
                  type="tel"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="field">
                <label className="field-label">Role</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${role === "EMPLOYEE" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setRole("EMPLOYEE")}
                    style={{ flex: 1 }}
                  >
                    Employee
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${role === "ADMIN" ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setRole("ADMIN")}
                    style={{ flex: 1 }}
                  >
                    Admin
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={creating}>
                {creating && <span className="spinner" />}
                {creating ? "Creating…" : "+ Create Account"}
              </button>
            </form>
          </div>

          {/* Users Table */}
          <div className="card-flush">
            <div className="card-header">
              <h3 className="card-title">All Users</h3>
              <p className="card-desc">{users.length} registered accounts</p>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Activity</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ color: "var(--text-dim)" }}>#{u.id}</td>
                    <td style={{ fontWeight: 500 }}>{u.username}</td>
                    <td style={{ color: u.email ? "var(--text-main)" : "var(--text-dim)" }}>
                      {u.email || "—"}
                    </td>
                    <td>
                      <span className={`badge ${u.role === "ADMIN" ? "badge-violet" : "badge-blue"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u._count.transactions} txns</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deletingId === u.id}
                        onClick={() => handleDelete(u)}
                      >
                        {deletingId === u.id ? <span className="spinner" /> : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="table-empty">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
