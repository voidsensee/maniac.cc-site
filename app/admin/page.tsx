"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";

type User = {
  id: string;
  username: string;
  role: string;
  hwid: string | null;
  banned: boolean;
  createdAt: string;
  lastLogin: string | null;
  lastIp: string | null;
  hwidResets: number;
};

export default function Admin() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");
    const res = await fetch("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return router.push("/dashboard");
    const d = await res.json();
    setUsers(d.users);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doAction = async (userId: string, action: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, action }),
    });
    await load();
  };

  if (loading) {
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

      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="animate-fade-in text-3xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-white/50">{users.length} users</p>

        <div className="glass animate-fade-in mt-8 overflow-hidden rounded-2xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">HWID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last IP</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{u.username}</td>
                  <td className="px-4 py-3 text-white/60">{u.role}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white/50">
                    {u.hwid ? u.hwid.slice(0, 12) + "..." : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.banned ? (
                      <span className="text-red-400">BANNED</span>
                    ) : (
                      <span className="text-emerald-400">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white/50">
                    {u.lastIp || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {u.banned ? (
                        <button
                          onClick={() => doAction(u.id, "unban")}
                          className="rounded border border-white/10 px-2 py-1 text-xs hover:border-emerald-400"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => doAction(u.id, "ban")}
                          className="rounded border border-white/10 px-2 py-1 text-xs hover:border-red-400"
                        >
                          Ban
                        </button>
                      )}
                      <button
                        onClick={() => doAction(u.id, "reset_hwid")}
                        className="rounded border border-white/10 px-2 py-1 text-xs hover:border-accent-purple"
                      >
                        Reset HWID
                      </button>
                      {u.role !== "admin" && (
                        <button
                          onClick={() => doAction(u.id, "make_admin")}
                          className="rounded border border-white/10 px-2 py-1 text-xs hover:border-accent-cyan"
                        >
                          +Admin
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
