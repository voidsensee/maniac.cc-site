"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";

type Me = {
  id: string;
  username: string;
  role: string;
  hwid: string | null;
  banned: boolean;
  createdAt: string;
  lastLogin: string | null;
  hwidResets: number;
};

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) {
          localStorage.removeItem("token");
          router.push("/login");
          return;
        }
        setMe(d.user);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  const resetHwid = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const res = await fetch("/api/hwid/reset", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setMe((m) => (m ? { ...m, hwid: null, hwidResets: m.hwidResets + 1 } : m));
      alert("HWID reset successfully");
    } else {
      const d = await res.json();
      alert(d.error || "reset failed");
    }
  };

  const downloadLoader = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const res = await fetch("/api/download", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "download failed" }));
      alert(err.error || "download failed");
      return;
    }

    const cd = res.headers.get("Content-Disposition") || "";
    const m = cd.match(/filename\*=UTF-8''([^;]+)/);
    const name = m ? decodeURIComponent(m[1]) : "installer.exe";

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading || !me) {
    return (
      <>
        <Starfield />
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center">
          <div className="text-white/40">loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Starfield />
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="animate-fade-in text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">
          Welcome back, {me.username}.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="glass animate-fade-in rounded-2xl p-6">
            <h2 className="text-sm uppercase tracking-wider text-white/40">
              Account
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Username" value={me.username} />
              <Row label="Role" value={me.role} />
              <Row label="Status" value={me.banned ? "BANNED" : "Active"} />
              <Row
                label="Registered"
                value={new Date(me.createdAt).toLocaleString()}
              />
              <Row
                label="Last login"
                value={me.lastLogin ? new Date(me.lastLogin).toLocaleString() : "—"}
              />
            </div>
          </div>

          <div className="glass animate-fade-in rounded-2xl p-6">
            <h2 className="text-sm uppercase tracking-wider text-white/40">HWID</h2>
            <div className="mt-4 space-y-2 text-sm">
              <Row
                label="HWID"
                value={me.hwid ? `${me.hwid.slice(0, 16)}...` : "not bound"}
              />
              <Row label="Resets used" value={String(me.hwidResets)} />
            </div>
            <button
              onClick={resetHwid}
              className="mt-6 w-full rounded-lg border border-white/10 py-2.5 text-sm text-white/70 hover:border-accent-purple hover:text-white transition"
            >
              Reset HWID
            </button>
          </div>
        </div>

        <div className="glass animate-fade-in mt-6 rounded-2xl p-6">
          <h2 className="text-sm uppercase tracking-wider text-white/40">
            Download
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Loader is available to all users with a bound HWID.
          </p>
          <button
            onClick={downloadLoader}
            className="btn-primary mt-4 rounded-lg px-6 py-2.5 text-sm font-medium"
          >
            Download Loader
          </button>
        </div>
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2">
      <span className="text-white/40">{label}</span>
      <span className="font-mono text-white/80">{value}</span>
    </div>
  );
}
