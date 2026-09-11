"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { username: string; role: string };
  _count: { messages: number };
};

export default function AdminTickets() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return router.push("/login");
    fetch("/api/tickets", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return router.push("/dashboard");
        setTickets(d.tickets);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = tickets.filter((t) => (filter === "all" ? true : t.status === filter));

  if (loading) {
    return (
      <>
        <Starfield />
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center text-white/40">
          loading...
        </main>
      </>
    );
  }

  return (
    <>
      <Starfield />
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="animate-fade-in text-3xl font-bold">Tickets</h1>

        <div className="mt-6 flex gap-2">
          {(["open", "closed", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm ${
                filter === f ? "btn-primary" : "glass text-white/70"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          {filtered.length === 0 && (
            <div className="glass rounded-2xl p-6 text-center text-sm text-white/40">
              no tickets
            </div>
          )}
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/support/${t.id}`}
              className="glass animate-fade-in flex items-center justify-between rounded-2xl p-5 transition hover:border-accent-cyan/40"
            >
              <div>
                <div className="font-medium">{t.subject}</div>
                <div className="mt-1 text-xs text-white/40">
                  {t.user.username} · {new Date(t.updatedAt).toLocaleString()} ·{" "}
                  {t._count.messages} messages
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  t.status === "open"
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-white/5 text-white/40"
                }`}
              >
                {t.status}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
