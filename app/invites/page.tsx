"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { formatMani } from "@/lib/currency";

type Invite = {
  id: string;
  code: string;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export default function InvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [canGenerate, setCanGenerate] = useState(true);
  const [canGenerateInMs, setCanGenerateInMs] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const token = () => localStorage.getItem("token");

  const load = async () => {
    const t = token();
    if (!t) return router.push("/login");
    const res = await fetch("/api/invite/mine", {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (res.ok) {
      const d = await res.json();
      setInvites(d.invites);
      setCanGenerate(d.canGenerate);
      setCanGenerateInMs(d.canGenerateInMs);
      setReferralEarnings(d.referralEarnings);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    const t = token();
    if (!t) return;
    setCreating(true);
    try {
      const res = await fetch("/api/invite/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${t}` },
      });
      const d = await res.json();
      if (res.ok) {
        toast.success("Invite generated");
        await load();
      } else {
        toast.error(d.error || "failed");
      }
    } finally {
      setCreating(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  const humanTime = (ms: number) => {
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    if (d > 0) return `${d}d ${h}h`;
    return `${h}h`;
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
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold">Invites</h1>
        <p className="mt-2 text-sm text-white/50">
          Invite friends and earn 10% of their purchases as Mani.
        </p>

        <div className="glass mt-8 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm uppercase tracking-wider text-white/40">
                Referral earnings
              </h2>
              <p className="mt-2 text-2xl font-bold text-amber-300">
                {formatMani(referralEarnings)}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-sm uppercase tracking-wider text-white/40">
                Next invite
              </h2>
              <p className="mt-2 text-sm text-white/60">
                {canGenerate ? "Ready" : `in ${humanTime(canGenerateInMs)}`}
              </p>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!canGenerate || creating}
            className="btn-primary mt-6 w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {creating ? "Generating..." : canGenerate ? "Generate invite" : "Cooldown"}
          </button>
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="text-sm uppercase tracking-wider text-white/40">
            Your invites ({invites.length})
          </h2>
          {invites.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-sm text-white/40">
              No invites yet.
            </div>
          ) : (
            invites.map((i) => (
              <div key={i.id} className="glass rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm">{i.code}</span>
                  <div className="flex items-center gap-2">
                    {i.usedBy ? (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/40">
                        used
                      </span>
                    ) : i.expiresAt && new Date(i.expiresAt) < new Date() ? (
                      <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                        expired
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">
                        available
                      </span>
                    )}
                    <button
                      onClick={() => copy(i.code)}
                      className="rounded border border-white/10 px-2 py-1 text-xs text-white/70 hover:border-accent-purple hover:text-white"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/40">
                  Created {new Date(i.createdAt).toLocaleString()}
                  {i.usedBy ? ` · used by ${i.usedBy}` : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
