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

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          maniac<span className="text-accent-purple">.</span>cc
        </Link>

        <div className="flex items-center gap-6 text-sm">
          {user ? (
            <>
              <Link href="/dashboard" className="text-white/70 hover:text-white transition">
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="text-white/70 hover:text-white transition">
                  Admin
                </Link>
              )}
              <span className="text-white/40">|</span>
              <span className="text-white/80">{user.username}</span>
              <button
                onClick={logout}
                className="rounded-md border border-white/10 px-3 py-1.5 text-white/70 hover:border-white/20 hover:text-white transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white/70 hover:text-white transition">
                Login
              </Link>
              <Link
                href="/login?mode=register"
                className="btn-primary rounded-md px-4 py-1.5 text-white font-medium"
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
