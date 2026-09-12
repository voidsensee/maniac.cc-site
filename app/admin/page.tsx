"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  subscriptionType: string | null;
  subscriptionUntil: string | null;
};

type Invite = {
  id: string;
  code: string;
  createdBy: string | null;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export default function Admin() {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "invites">("users");
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCount, setInviteCount] = useState(1);
  const [inviteTtl, setInviteTtl] = useState(0);
  const [generating, setGenerating] = useState(false);

  const token = () => localStorage.getItem("token");

  const loadMe = async () => {
    const t = token();
    if (!t) return router.push("/login");
    const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return router.push("/login");
    const d = await res.json();
    const role = d.user.role;
    if (role !== "admin" && role !== "support") return router.push("/dashboard");
    setMe({ role });
  };

  const loadUsers = async () => {
    const t = token();
    if (!t) return;
    const res = await fetch("/api/admin/users", { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return;
    const d = await res.json();
    setUsers(d.users);
  };

  const loadInvites = async () => {
    const t = token();
    if (!t) return;
    const res = await fetch("/api/admin/invites", { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return;
    const d = await res.json();
    setInvites(d.invites);
  };

  const load = async () => {
    await loadMe();
    await loadUsers();
    await loadInvites();
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userAction = async (userId: string, action: string, extra?: Record<string, any>) => {
    const t = token();
    if (!t) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ userId, action, ...extra }),
    });
    if (!res.ok) {
      const d = await res.json();
      alert(d.error || "failed");
    }
    await loadUsers();
  };

  const changeUsername = async (u: User) => {
    const newName = prompt(`New username for ${u.username}:`, u.username);
    if (!newName || newName === u.username) return;
    await userAction(u.id, "change_username", { username: newName });
  };

  const changePassword = async (u: User) => {
    const newPass = prompt(`New password for ${u.username}:`);
    if (!newPass) return;
    if (newPass.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    await userAction(u.id, "change_password", { password: newPass });
  };

  const generateInvites = async () => {
    const t = token();
    if (!t) return;
    setGenerating(true);
    await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ count: inviteCount, expiresInDays: inviteTtl }),
    });
    setGenerating(false);
    await loadInvites();
  };

  const deleteInvite = async (code: string) => {
    const t = token();
    if (!t) return;
    if (!confirm(`Delete invite ${code}?`)) return;
    await fetch("/api/admin/invites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ code }),
    });
    await loadInvites();
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

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

  const isAdmin = me?.role === "admin";

  const SUB_LABELS: Record<string, string> = {
    none: "—",
    gta_v_altv_7d: "7d",
    gta_v_altv_30d: "30d",
    gta_v_altv_lifetime: "lifetime",
  };

  return (
    <>
      <Starfield />
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="animate-fade-in text-3xl font-bold">Admin</h1>

        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setTab("users")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              tab === "users" ? "btn-primary" : "glass text-white/70 hover:text-white"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setTab("invites")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              tab === "invites" ? "btn-primary" : "glass text-white/70 hover:text-white"
            }`}
          >
            Invites ({invites.length})
          </button>
          <Link
            href="/admin/tickets"
            className="glass rounded-lg px-4 py-2 text-sm text-white/70 transition hover:text-white"
          >
            Tickets →
          </Link>
        </div>

        {tab === "users" && (
          <div className="glass animate-fade-in mt-6 overflow-x-auto rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Sub</th>
                  <th className="px-4 py-3">Until</th>
                  <th className="px-4 py-3">HWID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 font-mono text-[10px] text-white/30">
                      {u.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 font-medium">{u.username}</td>
                    <td className="px-4 py-3 text-white/60">{u.role}</td>
                    <td className="px-4 py-3 text-white/60">
                      {SUB_LABELS[u.subscriptionType || "none"] || u.subscriptionType || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/50">
                      {u.subscriptionType?.endsWith("_lifetime")
                        ? "∞"
                        : u.subscriptionUntil
                        ? new Date(u.subscriptionUntil).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/50">
                      {u.hwid ? u.hwid.slice(0, 10) + "..." : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {u.banned ? (
                        <span className="text-red-400">BANNED</span>
                      ) : (
                        <span className="text-emerald-400">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.banned ? (
                          <Btn onClick={() => userAction(u.id, "unban")}>Unban</Btn>
                        ) : (
                          <Btn onClick={() => userAction(u.id, "ban")}>Ban</Btn>
                        )}
                        <Btn onClick={() => userAction(u.id, "reset_hwid")}>Reset HWID</Btn>
                        {isAdmin && (
                          <>
                            <Btn onClick={() => userAction(u.id, "give_7d")}>+7d</Btn>
                            <Btn onClick={() => userAction(u.id, "give_30d")}>+30d</Btn>
                            <Btn onClick={() => userAction(u.id, "give_lifetime")}>+Life</Btn>
                            <Btn onClick={() => userAction(u.id, "revoke_sub")}>Revoke</Btn>
                            <Btn onClick={() => changeUsername(u)}>✎ Name</Btn>
                            <Btn onClick={() => changePassword(u)}>✎ Pass</Btn>
                            {u.role === "user" && (
                              <>
                                <Btn onClick={() => userAction(u.id, "make_support")}>+Support</Btn>
                                <Btn onClick={() => userAction(u.id, "make_admin")}>+Admin</Btn>
                              </>
                            )}
                            {u.role === "support" && (
                              <>
                                <Btn onClick={() => userAction(u.id, "make_user")}>-Support</Btn>
                                <Btn onClick={() => userAction(u.id, "make_admin")}>+Admin</Btn>
                              </>
                            )}
                            {u.role === "admin" && (
                              <Btn onClick={() => userAction(u.id, "make_user")}>-Admin</Btn>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "invites" && (
          <>
            <div className="glass animate-fade-in mt-6 rounded-2xl p-6">
              <h2 className="text-sm uppercase tracking-wider text-white/40">Generate invites</h2>
              <div className="mt-4 flex flex-wrap items-end gap-4">
                <div>
                  <label className="mb-1 block text-xs text-white/40">Count</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={inviteCount}
                    onChange={(e) => setInviteCount(Number(e.target.value))}
                    className="w-24 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent-purple"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-white/40">
                    Expires in (days, 0 = never)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={inviteTtl}
                    onChange={(e) => setInviteTtl(Number(e.target.value))}
                    className="w-32 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-accent-purple"
                  />
                </div>
                <button
                  onClick={generateInvites}
                  disabled={generating}
                  className="btn-primary rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50"
                >
                  {generating ? "..." : "Generate"}
                </button>
              </div>
            </div>

            <div className="glass animate-fade-in mt-6 overflow-x-auto rounded-2xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/40">
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Used by</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((i) => (
                    <tr key={i.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 font-mono text-xs">{i.code}</td>
                      <td className="px-4 py-3 text-xs text-white/50">
                        {new Date(i.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        {i.usedBy ? (
                          <span className="text-white/40">used</span>
                        ) : i.expiresAt && new Date(i.expiresAt) < new Date() ? (
                          <span className="text-red-400">expired</span>
                        ) : (
                          <span className="text-emerald-400">available</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">
                        {i.usedBy ? i.usedBy.slice(0, 12) + "..." : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <Btn onClick={() => copy(i.code)}>Copy</Btn>
                          <Btn onClick={() => deleteInvite(i.code)}>Delete</Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function Btn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded border border-white/10 px-2 py-1 text-xs text-white/70 transition hover:border-accent-purple hover:text-white"
    >
      {children}
    </button>
  );
}
