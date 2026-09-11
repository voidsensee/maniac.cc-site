"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";

type Message = {
  id: string;
  body: string;
  isStaff: boolean;
  createdAt: string;
  user: { username: string; role: string };
};

type Ticket = {
  id: string;
  subject: string;
  status: string;
  userId: string;
  user: { id: string; username: string; role: string };
  messages: Message[];
};

export default function TicketPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [me, setMe] = useState<{ username: string; role: string } | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);

  const token = () => localStorage.getItem("token");

  const loadMe = async () => {
    const t = token();
    if (!t) return router.push("/login");
    const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) {
      const d = await res.json();
      setMe({ username: d.user.username, role: d.user.role });
    }
  };

  const load = async () => {
    const t = token();
    if (!t) return router.push("/login");
    const res = await fetch(`/api/tickets/${params.id}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) return router.push("/support");
    const d = await res.json();
    setTicket(d.ticket);
  };

  useEffect(() => {
    loadMe();
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [ticket]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !ticket) return;
    const t = token();
    if (!t) return;
    setSending(true);
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ body: text.trim() }),
    });
    setText("");
    setSending(false);
    await load();
  };

  const isStaff = me?.role === "admin" || me?.role === "support";

  const toggleStatus = async () => {
    if (!ticket || !isStaff) return;
    const t = token();
    if (!t) return;
    await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ status: ticket.status === "open" ? "closed" : "open" }),
    });
    await load();
  };

  if (!ticket) {
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

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <p className="mt-1 text-xs text-white/40">
              opened by {ticket.user.username} · {ticket.status}
            </p>
          </div>
          {isStaff && (
            <button
              onClick={toggleStatus}
              className="rounded-lg border border-white/10 px-4 py-2 text-xs text-white/70 transition hover:border-accent-purple"
            >
              {ticket.status === "open" ? "Close" : "Reopen"}
            </button>
          )}
        </div>

        <div
          ref={scroller}
          className="glass mt-6 max-h-[60vh] overflow-y-auto rounded-2xl p-4"
        >
          {ticket.messages.map((m) => {
            const mine = me?.username === m.user.username;
            return (
              <div
                key={m.id}
                className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.isStaff
                      ? "border border-accent-cyan/30 bg-accent-cyan/10"
                      : mine
                      ? "bg-gradient-to-br from-accent-purple to-accent-cyan text-white"
                      : "bg-white/5 text-white/90"
                  }`}
                >
                  <div className="mb-1 text-[10px] uppercase tracking-wider opacity-70">
                    {m.user.username}
                    {m.user.role !== "user" && ` · ${m.user.role}`}
                  </div>
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                  <div className="mt-1 text-[10px] opacity-50">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {ticket.status === "open" ? (
          <form onSubmit={send} className="mt-4 flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              maxLength={4000}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-accent-purple"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="btn-primary rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-40"
            >
              Send
            </button>
          </form>
        ) : (
          <div className="glass mt-4 rounded-2xl p-4 text-center text-sm text-white/40">
            ticket closed
          </div>
        )}
      </main>
    </>
  );
}
