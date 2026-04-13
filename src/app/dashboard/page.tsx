"use client";

import { useState, useEffect, useRef } from "react";
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
  action: string;
  quantity: number;
  timestamp: string;
}

interface ModalState {
  open: boolean;
  componentId: number;
  componentName: string;
  action: "BORROW" | "RETURN" | "LOST";
}

export default function DashboardPage() {
  const router = useRouter();
  const [components, setComponents] = useState<Component[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ready, setReady] = useState(false);
  const [activityFilter, setActivityFilter] = useState<"ALL" | "BORROW" | "RETURN" | "LOST">("ALL");

  // Modal state
  const [modal, setModal] = useState<ModalState>({ open: false, componentId: 0, componentName: "", action: "BORROW" });
  const [qty, setQty] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const qtyInputRef = useRef<HTMLInputElement>(null);

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

  // Open the modal
  const openModal = (componentId: number, componentName: string, action: "BORROW" | "RETURN" | "LOST") => {
    setModal({ open: true, componentId, componentName, action });
    setQty("1");
    setError("");
    setSuccess("");
    setTimeout(() => qtyInputRef.current?.focus(), 100);
  };

  // Close the modal
  const closeModal = () => {
    setModal({ ...modal, open: false });
  };

  // Submit from modal
  const handleSubmit = async () => {
    const quantity = parseInt(qty);
    if (isNaN(quantity) || quantity <= 0) {
      setError("Please enter a valid quantity");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentId: modal.componentId,
          action: modal.action,
          quantity,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`${quantity}× ${modal.componentName} — ${modal.action.toLowerCase()} recorded`);
      closeModal();
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return <div className="loading-page"><span className="spinner" /> Loading…</div>;

  const totalBorrowed = transactions.filter(t => t.action === "BORROW").reduce((s, t) => s + t.quantity, 0);
  const totalReturned = transactions.filter(t => t.action === "RETURN").reduce((s, t) => s + t.quantity, 0);
  const totalLost = transactions.filter(t => t.action === "LOST").reduce((s, t) => s + t.quantity, 0);

  // Calculate per-component outstanding borrows
  const outstandingByComponent: Record<number, number> = {};
  transactions.forEach(t => {
    const cid = t.component?.id;
    if (!cid) return;
    if (!outstandingByComponent[cid]) outstandingByComponent[cid] = 0;
    if (t.action === "BORROW") outstandingByComponent[cid] += t.quantity;
    if (t.action === "RETURN" || t.action === "LOST") outstandingByComponent[cid] -= t.quantity;
  });

  const actionLabels: Record<string, { title: string; desc: string; btnClass: string; btnText: string }> = {
    BORROW: { title: "Check Out Component", desc: "Items will be deducted from available stock", btnClass: "btn-primary", btnText: "Confirm Check Out" },
    RETURN: { title: "Return Component", desc: "Items will be added back to available stock", btnClass: "btn-success", btnText: "Confirm Return" },
    LOST: { title: "Report Lost", desc: "Items will be permanently removed from total inventory", btnClass: "btn-danger", btnText: "Confirm Lost" },
  };

  return (
    <>
      <Navbar role="EMPLOYEE" />
      <div className="page-wrap">
        <div className="page-header">
          <div>
            <h1 className="page-title">Employee Dashboard</h1>
            <p className="page-subtitle">Check out, return, or report lost components</p>
          </div>
          <span className="badge badge-blue">EMPLOYEE</span>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card blue">
            <div className="stat-label">Available Components</div>
            <div className="stat-value blue">{components.length}</div>
          </div>
          <div className="stat-card amber">
            <div className="stat-label">Checked Out</div>
            <div className="stat-value amber">{totalBorrowed - totalReturned - totalLost}</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Reported Lost</div>
            <div className="stat-value red">{totalLost}</div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="grid-2">
          {/* Inventory */}
          <div className="card">
            <h3 className="card-title">Inventory</h3>
            <p className="card-desc" style={{ marginBottom: 16 }}>Components available for checkout</p>

            {components.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <div className="empty-state-text">No components in inventory yet</div>
              </div>
            ) : (
              <ul className="item-list">
                {components.map((c) => (
                  <li key={c.id} className="item">
                    <div className="item-top">
                      <span className="item-name">{c.name}</span>
                      <span className={`badge ${c.availableQuantity > 0 ? "badge-green" : "badge-red"}`}>
                        {c.availableQuantity} / {c.totalQuantity}
                      </span>
                    </div>
                    {c.description && <p className="item-desc">{c.description}</p>}
                    <div className="item-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openModal(c.id, c.name, "BORROW")}
                        disabled={c.availableQuantity <= 0}
                      >
                        Check Out
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Activity */}
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <div>
                <h3 className="card-title">My Activity</h3>
                <p className="card-desc">Your borrowing history &amp; actions</p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["ALL", "BORROW", "RETURN", "LOST"] as const).map((f) => (
                  <button
                    key={f}
                    className={`btn btn-sm ${activityFilter === f ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setActivityFilter(f)}
                  >
                    {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">No activity recorded yet</div>
              </div>
            ) : (
              <ul className="item-list" style={{ maxHeight: 520, overflowY: "auto" }}>
                {transactions.filter(t => activityFilter === "ALL" || t.action === activityFilter).map((txn) => (
                  <li key={txn.id} className="item">
                    <div className="item-top">
                      <span className="item-name">{txn.component?.name || "Unknown"}</span>
                      <span className={`badge ${
                        txn.action === "BORROW" ? "badge-amber" :
                        txn.action === "LOST" ? "badge-red" : "badge-green"
                      }`}>
                        {txn.action} ×{txn.quantity}
                      </span>
                    </div>
                    <p className="item-desc" style={{ marginBottom: txn.action === "BORROW" ? 12 : 0 }}>
                      {new Date(txn.timestamp).toLocaleString()}
                    </p>
                    {txn.action === "BORROW" && (outstandingByComponent[txn.component?.id] || 0) > 0 && (
                      <div className="item-actions">
                        <button className="btn btn-success btn-sm" onClick={() => openModal(txn.component.id, txn.component.name, "RETURN")}>
                          Return
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => openModal(txn.component.id, txn.component.name, "LOST")}>
                          Report Lost
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ---- MODAL ---- */}
      {modal.open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{actionLabels[modal.action].title}</h3>
              <p className="modal-desc">{modal.componentName} — {actionLabels[modal.action].desc}</p>
            </div>
            <div className="modal-body">
              <div className="field">
                <label className="field-label">Quantity</label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="1"
                  className="input"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal} disabled={submitting}>
                Cancel
              </button>
              <button className={`btn ${actionLabels[modal.action].btnClass}`} onClick={handleSubmit} disabled={submitting}>
                {submitting && <span className="spinner" />}
                {submitting ? "Processing…" : actionLabels[modal.action].btnText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
