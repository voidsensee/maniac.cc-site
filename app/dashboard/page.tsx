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
  subscriptionType: string | null;
  subscriptionUntil: string | null;
};

const LABELS: Record<string, string> = {
  none: "No subscription",
  gta_v_altv_7d: "GTA V / alt:V — 7 days",
  gta_v_altv_30d: "GTA V / alt:V — 30 days",
  gta_v_altv_lifetime: "GTA V / alt:V — Lifetime",
};

export default function Dashboard() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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
    setDownloading(true);
    try {
      const res = await fetch("/api/download", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "download failed" }));
        alert(`${err.error}${err.status ? ` (${err.status})` : ""}`);
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
    } finally {
      setDownloading(false);
    }
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

  // Подписка
  const subType = me.subscriptionType || "none";
  const isLifetime = subType.endsWith("_lifetime");
  const label = LABELS[subType] || "No subscription";

  let subLabel = "No subscription";
  let subColor = "text-red-400";

  if (isLifetime) {
    subLabel = "Lifetime";
    subColor = "text-green-400";
  } else if (me.subscriptionUntil) {
    const diff = new Date(me.subscriptionUntil).getTime() - Date.now();
    const daysLeft = Math.max(0, Math.ceil(diff / 86400000));
    if (daysLeft > 0) {
      subLabel = `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
      subColor = daysLeft > 7 ? "text-green-400" : "text-yellow-400";
    } else {
      subLabel = "Expired";
      subColor = "text-red-400";
    }
  }

  return (
    <>
      <Starfield />
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="animate-fade-in text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-white/50">Welcome back, {me.username}.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="glass animate-fade-in rounded-2xl p-6">
            <h2 className="text-sm uppercase tracking-wider text-white/40">Account</h2>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Username" value={me.username} />
              <Row label="Role" value={me.role} />
              <Row label="Status" value={me.banned ? "BANNED" : "Active"} />
              <Row label="Registered" value={new Date(me.createdAt).toLocaleString()} />
              <Row
                label="Last login"
                value={me.lastLogin ? new Date(me.lastLogin).toLocaleString() : "—"}
              />
            </div>
          </div>

          <div className="glass animate-fade-in rounded-2xl p-6">
            <h2 className="text-sm uppercase tracking-wider text-white/40">Subscription</h2>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Plan" value={label} />
              <Row
                label="Until"
                value={
                  isLifetime
                    ? "∞"
                    : me.subscriptionUntil
                    ? new Date(me.subscriptionUntil).toLocaleDateString()
                    : "—"
                }
              />
            </div>
            <div className={`mt-6 text-center text-2xl font-bold ${subColor}`}>
              {subLabel}
            </div>
          </div>

          <div className="glass animate-fade-in rounded-2xl p-6 md:col-span-2">
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
          <h2 className="text-sm uppercase tracking-wider text-white/40">Download</h2>
          <p className="mt-2 text-sm text-white/50">
            Loader is available to all users with a bound HWID.
          </p>
          <button
            onClick={downloadLoader}
            disabled={downloading}
            className="btn-primary mt-4 rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {downloading ? "Downloading..." : "Download Loader"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            onClick={() => router.push("/password")}
            className="glass animate-fade-in rounded-2xl p-6 text-left hover:border-accent-purple transition"
          >
            <h2 className="text-sm uppercase tracking-wider text-white/40">Security</h2>
            <p className="mt-2 text-base font-medium">Change Password</p>
            <p className="mt-1 text-xs text-white/40">Update your account password</p>
          </button>

          <button
            onClick={() => router.push("/tickets")}
            className="glass animate-fade-in rounded-2xl p-6 text-left hover:border-accent-purple transition"
          >
            <h2 className="text-sm uppercase tracking-wider text-white/40">Support</h2>
            <p className="mt-2 text-base font-medium">Tickets</p>
            <p className="mt-1 text-xs text-white/40">Open or view your support tickets</p>
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
