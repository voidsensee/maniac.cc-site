"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setUser(d.user))
      .catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; max-age=0; path=/";
    window.location.href = "/";
  };

  const isStaff = user?.role === "admin" || user?.role === "support";

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          maniac<span className="text-accent-purple">.</span>cc
        </Link>

        <div className="flex items-center gap-5 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-white/70 transition hover:text-white">
                Dashboard
              </Link>
              <Link href="/support" className="text-white/70 transition hover:text-white">
                Support
              </Link>
              {isStaff && (
                <Link href="/admin" className="text-white/70 transition hover:text-white">
                  Admin
                </Link>
              )}
              {isStaff && (
                <Link href="/admin/tickets" className="text-white/70 transition hover:text-white">
                  Tickets
                </Link>
              )}
              <span className="text-white/30">|</span>
              <span className="text-white/80">
                {user.username}
                {user.role !== "user" && (
                  <span className="ml-1 text-xs text-accent-cyan">[{user.role}]</span>
                )}
              </span>
              <button
                onClick={logout}
                className="rounded-md border border-white/10 px-3 py-1.5 text-white/70 transition hover:border-white/20 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white/70 transition hover:text-white">
                Login
              </Link>
              <Link
                href="/login?mode=register"
                className="btn-primary rounded-md px-4 py-1.5 font-medium text-white"
              >
                Get Access
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
