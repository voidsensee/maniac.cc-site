"use client";

import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";

export default function TopupPage() {
  return (
    <>
      <Starfield />
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold">Top up balance</h1>
        <p className="mt-2 text-sm text-white/50">
          Contact support to top up your balance. Crypto payments coming soon.
        </p>
        <div className="glass mt-8 rounded-2xl p-6">
          <p className="text-sm text-white/70">
            To add Mani to your account, open a ticket with the amount you want to
            purchase.
          </p>
        </div>
      </main>
    </>
  );
}
