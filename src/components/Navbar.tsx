"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function Navbar({ role }: { role: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const dashHref = role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <nav className="navbar">
      <Link href={dashHref} className="navbar-brand">
        <img
          src="/logo.png"
          alt="Robomanthan"
          className="navbar-logo"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        Robomanthan
      </Link>

      <div className="navbar-links">
        <Link
          href={dashHref}
          className={`nav-item ${pathname === dashHref ? "active" : ""}`}
        >
          Dashboard
        </Link>
        {role === "ADMIN" && (
          <Link
            href="/admin/users"
            className={`nav-item ${pathname === "/admin/users" ? "active" : ""}`}
          >
            Users
          </Link>
        )}
        <Link
          href="/profile"
          className={`nav-item ${pathname === "/profile" ? "active" : ""}`}
        >
          Profile
        </Link>
        <button onClick={handleLogout} className="nav-logout">
          Sign Out
        </button>
      </div>
    </nav>
  );
}
