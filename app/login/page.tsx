"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">(
    params.get("mode") === "register" ? "register" : "login"
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login" ? { username, password } : { username, password, invite };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "request failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 3600}`;
      router.push("/dashboard");
    } catch {
      setError("network error");
      setLoading(false);
    }
  };

  return (
    <>
      <Starfield />
      <Navbar />

      <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6">
        <div className="glass animate-fade-in rounded-2xl p-8">
          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Welcome back" : "Redeem invite"}
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {mode === "login" ? "Sign in to your account." : "Enter your invite code to create account."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">
                  Invite code
                </label>
                <input
                  value={invite}
                  onChange={(e) => setInvite(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 outline-none transition focus:border-accent-purple"
                  placeholder="MANIAC-XXXX-XXXX"
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 outline-none transition focus:border-accent-purple"
                placeholder="username"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-white/40">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 outline-none transition focus:border-accent-purple"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-lg py-3 font-medium disabled:opacity-50"
            >
              {loading ? "..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="mt-6 w-full text-center text-sm text-white/50 hover:text-white transition"
          >
            {mode === "login" ? "Have an invite? Redeem it →" : "Already have an account? Sign in →"}
          </button>
        </div>
      </main>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
