"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { formatMani } from "@/lib/currency";
import { SHOP_ITEMS } from "@/lib/shop";

type Me = {
  id: string;
  username: string;
  balance: number;
  role: string;
};

export default function ShopPage() {
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
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shop</h1>
            <p className="mt-1 text-sm text-white/50">
              Buy software and services with Mani.
            </p>
          </div>
          <div className="glass rounded-xl px-4 py-2 text-right">
            <div className="text-xs uppercase tracking-wider text-white/40">Balance</div>
            <div className="text-lg font-bold text-amber-300">
              {formatMani(me.balance)}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {SHOP_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(`/shop/${item.slug}`)}
              className="glass animate-fade-in rounded-2xl p-6 text-left transition hover:border-accent-purple"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-purple/20 text-2xl">
                  🛡
                </div>
                {!item.available && (
                  <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-300">
                    Soon
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-lg font-bold">{item.name.en}</h2>
              <p className="mt-2 text-xs text-white/50">{item.short.en}</p>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-xl font-bold text-amber-300">
                  {formatMani(item.price)}
                </span>
                <span className="text-xs text-white/40">View →</span>
              </div>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
