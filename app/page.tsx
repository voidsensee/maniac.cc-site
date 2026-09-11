import Link from "next/link";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Starfield />
      <Navbar />

      <main className="relative mx-auto max-w-6xl px-6">
        <section className="flex min-h-[80vh] flex-col items-center justify-center text-center">
          <div className="animate-fade-in">
            <span className="glass inline-block rounded-full px-4 py-1.5 text-xs uppercase tracking-widest text-white/60">
              private access only
            </span>
          </div>

          <h1 className="animate-fade-in mt-8 text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl">
            maniac
            <span className="bg-gradient-to-r from-accent-purple to-accent-cyan bg-clip-text text-transparent">
              .cc
            </span>
          </h1>

          <p className="animate-fade-in mt-6 max-w-xl text-lg text-white/60">
            Premium software, built for performance. Invite-only access.
          </p>

          <div className="animate-fade-in mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login?mode=register"
              className="btn-primary animate-pulse-glow rounded-lg px-8 py-3 font-medium"
            >
              Redeem Invite
            </Link>
            <Link
              href="/login"
              className="glass rounded-lg px-8 py-3 font-medium text-white/80 transition hover:text-white"
            >
              Login
            </Link>
          </div>
        </section>

        <section className="grid gap-6 pb-24 sm:grid-cols-3">
          {[
            { title: "Undetected", desc: "Built for stability. Bypasses modern anti-cheat." },
            { title: "Invite-Only", desc: "No public access. Users are hand-picked." },
            { title: "Support 24/7", desc: "Our team is always ready to help you." },
          ].map((f) => (
            <div
              key={f.title}
              className="glass animate-fade-in rounded-2xl p-6 transition hover:border-white/15"
            >
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-white/50">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/5 py-6 text-center text-xs text-white/30">
        © {new Date().getFullYear()} maniac.cc — all rights reserved.
      </footer>
    </>
  );
}
