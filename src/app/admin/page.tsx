"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Component {
  id: number;
  name: string;
  description: string;
  totalQuantity: number;
  availableQuantity: number;
}

interface Transaction {
  id: number;
  component: Component;
  user: { id: number; username: string };
  action: string;
  quantity: number;
  timestamp: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [components, setComponents] = useState<Component[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ready, setReady] = useState(false);
  const [auditFilter, setAuditFilter] = useState<"ALL" | "BORROW" | "RETURN" | "LOST">("ALL");

  // Add component form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("");

  // Edit modal state
  const [editModal, setEditModal] = useState(false);
  const [editId, setEditId] = useState(0);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editing, setEditing] = useState(false);
  const [deletingCompId, setDeletingCompId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [compRes, txnRes] = await Promise.all([
        fetch("/api/components"),
        fetch("/api/transactions"),
      ]);
      if (compRes.status === 401 || txnRes.status === 401) {
        router.push("/login");
        return;
      }
      if (compRes.ok) setComponents((await compRes.json()).components);
      if (txnRes.ok) setTransactions((await txnRes.json()).transactions);
      setReady(true);
    } catch {
      setError("Failed to load data");
      setReady(true);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name || !totalQuantity) return;

    try {
      const res = await fetch("/api/components", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, totalQuantity }),
      });
      if (!res.ok) throw new Error("Failed to add component");
      setName("");
      setDescription("");
      setTotalQuantity("");
      setSuccess(`"${name}" added to inventory`);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!ready) return <div className="loading-page"><span className="spinner" /> Loading…</div>;

  const totalItems = components.reduce((s, c) => s + c.totalQuantity, 0);
  const totalAvail = components.reduce((s, c) => s + c.availableQuantity, 0);
  const checkedOut = totalItems - totalAvail;
  const lostCount = transactions.filter(t => t.action === "LOST").reduce((s, t) => s + t.quantity, 0);

  return (
    <>
      <Navbar role="ADMIN" />
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="page-title">Admin Console</h1>
            <p className="page-subtitle">Manage inventory, track usage across all employees</p>
          </div>
          <span className="badge badge-violet">ADMIN</span>
        </div>

        {/* Stats Row */}
        <div className="stats-row">
          <div className="stat-card blue">
            <div className="stat-label">Component Types</div>
            <div className="stat-value blue">{components.length}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Total Items</div>
            <div className="stat-value green">{totalItems}</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-label">Checked Out</div>
            <div className="stat-value amber">{checkedOut}</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Lost</div>
            <div className="stat-value red">{lostCount}</div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Add component + Inventory table */}
        <div className="grid-sidebar" style={{ marginBottom: "1.5rem" }}>
          {/* Add Component */}
          <div className="card">
            <h3 className="card-title">Add Component</h3>
            <p className="card-desc" style={{ marginBottom: 20 }}>Register new items to inventory</p>
            <form onSubmit={handleAddComponent} className="form">
              <div className="field">
                <label className="field-label">Name</label>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. ESP32 DevKit V1"
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">Description</label>
                <input
                  type="text"
                  className="input"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional specs or notes"
                />
              </div>
              <div className="field">
                <label className="field-label">Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  value={totalQuantity}
                  onChange={(e) => setTotalQuantity(e.target.value)}
                  placeholder="10"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                + Add to Inventory
              </button>
            </form>
          </div>

          {/* Inventory table */}
          <div className="card-flush">
            <div className="card-header">
              <h3 className="card-title">Inventory Overview</h3>
              <p className="card-desc">Real-time stock levels</p>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Total</th>
                  <th>Available</th>
                  <th>In Use</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {components.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                    <td>{c.totalQuantity}</td>
                    <td>{c.availableQuantity}</td>
                    <td>{c.totalQuantity - c.availableQuantity}</td>
                    <td>
                      {c.availableQuantity > 0 ? (
                        <span className="badge badge-green">In Stock</span>
                      ) : (
                        <span className="badge badge-red">Depleted</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setEditId(c.id);
                            setEditName(c.name);
                            setEditDesc(c.description || "");
                            setEditQty(String(c.totalQuantity));
                            setEditModal(true);
                            setError("");
                            setSuccess("");
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={deletingCompId === c.id}
                          onClick={async () => {
                            if (!confirm(`Delete "${c.name}"? This will remove all its transaction history too.`)) return;
                            setDeletingCompId(c.id);
                            setError("");
                            try {
                              const res = await fetch("/api/components", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: c.id }),
                              });
                              const data = await res.json();
                              if (!res.ok) throw new Error(data.error);
                              setSuccess(`"${c.name}" deleted`);
                              fetchData();
                            } catch (err: any) {
                              setError(err.message);
                            } finally {
                              setDeletingCompId(null);
                            }
                          }}
                        >
                          {deletingCompId === c.id ? <span className="spinner" /> : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {components.length === 0 && (
                  <tr><td colSpan={6} className="table-empty">No components registered yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Trail */}
        <div className="card-flush">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <h3 className="card-title">Audit Trail</h3>
              <p className="card-desc">Complete log of all inventory movements</p>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["ALL", "BORROW", "RETURN", "LOST"] as const).map((f) => (
                <button
                  key={f}
                  className={`btn btn-sm ${auditFilter === f ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setAuditFilter(f)}
                >
                  {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Employee</th>
                <th>Component</th>
                <th>Action</th>
                <th>Qty</th>
              </tr>
            </thead>
            <tbody>
              {transactions.filter(t => auditFilter === "ALL" || t.action === auditFilter).map((txn) => (
                <tr key={txn.id}>
                  <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {new Date(txn.timestamp).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: 500 }}>{txn.user?.username || "—"}</td>
                  <td>{txn.component?.name || "—"}</td>
                  <td>
                    <span className={`badge ${
                      txn.action === "BORROW" ? "badge-amber" :
                      txn.action === "LOST" ? "badge-red" : "badge-green"
                    }`}>
                      {txn.action}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{txn.quantity}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={5} className="table-empty">No transactions yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Component Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Component</h3>
              <p className="modal-desc">Update details or add new stock</p>
            </div>
            <div className="modal-body">
              <div className="form">
                <div className="field">
                  <label className="field-label">Name</label>
                  <input
                    type="text"
                    className="input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Description</label>
                  <input
                    type="text"
                    className="input"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="field-label">Total Quantity</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                  />
                  <p className="card-desc" style={{ marginTop: 4, fontSize: "0.78rem" }}>
                    Increase this number when new stock is purchased
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditModal(false)} disabled={editing}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={editing}
                onClick={async () => {
                  setEditing(true);
                  setError("");
                  try {
                    const res = await fetch("/api/components", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: editId, name: editName, description: editDesc, totalQuantity: editQty }),
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    setSuccess(`"${editName}" updated — total quantity is now ${editQty}`);
                    setEditModal(false);
                    fetchData();
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setEditing(false);
                  }
                }}
              >
                {editing && <span className="spinner" />}
                {editing ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
