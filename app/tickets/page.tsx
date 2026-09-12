"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const res = await fetch("/api/tickets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const d = await res.json();
      setTickets(d.tickets);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, body }),
      });
      if (res.ok) {
        setSubject("");
        setBody("");
        await load();
        toast.success("Ticket created");
      } else {
        const d = await res.json();
        toast.error(d.error || "failed");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Starfield />
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">Support</h1>

        <form onSubmit={create} className="glass mt-8 space-y-4 rounded-2xl p-6">
          <h2 className="text-sm uppercase tracking-wider text-white/40">New ticket</h2>
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
            required
          />
          <textarea
            placeholder="Describe your issue..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
            required
          />
          <button
            type="submit"
            disabled={creating}
            className="btn-primary rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Ticket"}
          </button>
        </form>

        <div className="mt-8 space-y-4">
          <h2 className="text-sm uppercase tracking-wider text-white/40">
            Your tickets ({tickets.length})
          </h2>
          {loading ? (
            <div className="text-white/40">loading...</div>
          ) : tickets.length === 0 ? (
            <div className="text-white/40">No tickets yet.</div>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => router.push(`/support/${t.id}`)}
                className="glass block w-full rounded-2xl p-5 text-left transition hover:border-accent-purple"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.subject}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs uppercase">
                    {t.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-white/40">
                  {new Date(t.createdAt).toLocaleString()}
                  {t._count ? ` · ${t._count.messages} messages` : ""}
                </p>
              </button>
            ))
          )}
        </div>
      </main>
    </>
  );
}
