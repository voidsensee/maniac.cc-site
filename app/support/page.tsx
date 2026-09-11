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

export default function Support() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const token = () => localStorage.getItem("token");

  const load = async () => {
    const t = token();
    if (!t) return router.push("/login");
    const res = await fetch("/api/tickets", { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return router.push("/login");
    const d = await res.json();
    setTickets(d.tickets);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = token();
    if (!t || !subject || !body) return;
    setCreating(true);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ subject, body }),
    });
    setCreating(false);
    if (res.ok) {
      setSubject("");
      setBody("");
      await load();
    }
  };

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
        <h1 className="animate-fade-in text-3xl font-bold">Support</h1>
        <p className="mt-1 text-sm text-white/50">
          Open a ticket, our team will respond as soon as possible.
        </p>

        <form onSubmit={create} className="glass animate-fade-in mt-8 rounded-2xl p-6">
          <h2 className="text-sm uppercase tracking-wider text-white/40">New ticket</h2>

          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            maxLength={120}
            className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 outline-none focus:border-accent-purple"
            required
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your issue..."
            maxLength={4000}
            rows={4}
            className="mt-3 w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 outline-none focus:border-accent-purple"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="btn-primary mt-4 rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {creating ? "..." : "Create ticket"}
          </button>
        </form>

        <h2 className="mt-10 text-xl font-semibold">Your tickets</h2>
        <div className="mt-4 space-y-3">
          {tickets.length === 0 && (
            <div className="glass rounded-2xl p-6 text-center text-sm text-white/40">
              no tickets yet
            </div>
          )}
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/support/${t.id}`}
              className="glass animate-fade-in flex items-center justify-between rounded-2xl p-5 transition hover:border-accent-purple/40"
            >
              <div>
                <div className="font-medium">{t.subject}</div>
                <div className="mt-1 text-xs text-white/40">
                  {new Date(t.createdAt).toLocaleString()} · {t._count.messages} messages
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
