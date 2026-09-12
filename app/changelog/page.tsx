"use client";

import { useEffect, useState } from "react";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

type Entry = {
  id: string;
  version: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
};

const TYPE_STYLES: Record<string, { label: string; color: string; icon: string }> = {
  update: { label: "Update", color: "text-blue-400 border-blue-400/30 bg-blue-400/10", icon: "◆" },
  feature: { label: "Feature", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10", icon: "✦" },
  fix: { label: "Fix", color: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10", icon: "▸" },
  breaking: { label: "Breaking", color: "text-red-400 border-red-400/30 bg-red-400/10", icon: "⚠" },
  security: { label: "Security", color: "text-purple-400 border-purple-400/30 bg-purple-400/10", icon: "⚿" },
};

export default function ChangelogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/changelog")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Starfield />
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="animate-fade-in text-4xl font-bold">Changelog</h1>
        <p className="mt-2 text-sm text-white/50">
          All updates, features and fixes.
        </p>

        {loading ? (
          <div className="mt-8 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass animate-pulse rounded-2xl p-6">
                <div className="h-4 w-24 rounded bg-white/5" />
                <div className="mt-3 h-5 w-64 rounded bg-white/5" />
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded bg-white/5" />
                  <div className="h-3 w-3/4 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="glass mt-8 rounded-2xl p-12 text-center">
            <p className="text-white/40">No changelog entries yet.</p>
          </div>
        ) : (
          <div className="relative mt-8">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
            <div className="space-y-6">
              {entries.map((e, i) => {
                const t = TYPE_STYLES[e.type] || TYPE_STYLES.update;
                return (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative pl-8"
                  >
                    <div className="absolute left-0 top-3 h-3.5 w-3.5 rounded-full border-2 border-accent-purple bg-black" />
                    <div className="glass rounded-2xl p-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-sm font-bold text-accent-purple">
                          {e.version}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${t.color}`}>
                          {t.label}
                        </span>
                        <span className="ml-auto text-xs text-white/30">
                          {new Date(e.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <h2 className="mt-3 text-lg font-semibold">{e.title}</h2>
                      <div className="mt-2 whitespace-pre-wrap text-sm text-white/60">
                        {e.body}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
