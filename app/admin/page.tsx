"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { formatMani } from "@/lib/currency";
import { ROLES } from "@/lib/roles";
import { STATUS_LIST } from "@/lib/status";
import { StatusBadge } from "@/components/StatusBadge";

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
  balance: number;
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

type Changelog = {
  id: string;
  version: string;
  title: string;
  body: string;
  type: string;
  published: boolean;
  createdAt: string;
};

const SUB_LABELS: Record<string, string> = {
  none: "—",
  gta_v_altv_7d: "7d",
  gta_v_altv_30d: "30d",
  gta_v_altv_lifetime: "lifetime",
};

const ASSIGNABLE_ROLES = [
  "user",
  "tester",
  "moderator",
  "support",
  "finance",
  "developer",
  "admin",
];

export default function Admin() {
  const router = useRouter();
  const [tab, setTab] = useState<"users" | "invites" | "status" | "changelog">("users");
  const [me, setMe] = useState<{ role: string } | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCount, setInviteCount] = useState(1);
  const [inviteTtl, setInviteTtl] = useState(0);
  const [generating, setGenerating] = useState(false);

  // status
  const [statusState, setStatusState] = useState("undetected");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

  // changelog
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [clVersion, setClVersion] = useState("");
  const [clTitle, setClTitle] = useState("");
  const [clBody, setClBody] = useState("");
  const [clType, setClType] = useState("update");
  const [clPublished, setClPublished] = useState(true);
  const [clSaving, setClSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const token = () => localStorage.getItem("token");

  const loadMe = async () => {
    const t = token();
    if (!t) return router.push("/login");
    const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return router.push("/login");
    const d = await res.json();
    const role = d.user.role;
    if (role === "user" || role === "banned" || role === "tester") {
      return router.push("/dashboard");
    }
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

  const loadStatus = async () => {
    const res = await fetch("/api/status");
    if (res.ok) {
      const d = await res.json();
      setStatusState(d.status.state);
      setStatusMessage(d.status.message || "");
    }
  };

  const loadChangelogs = async () => {
    const res = await fetch("/api/changelog");
    if (res.ok) {
      const d = await res.json();
      setChangelogs(d.entries);
    }
  };

  const load = async () => {
    await loadMe();
    await loadUsers();
    await loadInvites();
    await loadStatus();
    await loadChangelogs();
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userAction = async (
    userId: string,
    action: string,
    extra?: Record<string, any>
  ) => {
    const t = token();
    if (!t) return;
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ userId, action, ...extra }),
    });
    const d = await res.json();
    if (!res.ok) toast.error(d.error || "failed");
    else toast.success("Done");
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
    if (newPass.length < 6) return toast.error("min 6 chars");
    await userAction(u.id, "change_password", { password: newPass });
  };

  const addBalance = async (u: User) => {
    const amt = prompt(`Add Mani to ${u.username}:`, "100");
    if (!amt) return;
    await userAction(u.id, "add_balance", { amount: Number(amt) });
  };

  const removeBalance = async (u: User) => {
    const amt = prompt(`Remove Mani from ${u.username}:`, "100");
    if (!amt) return;
    await userAction(u.id, "remove_balance", { amount: Number(amt) });
  };

  const setBalance = async (u: User) => {
    const amt = prompt(`Set Mani for ${u.username}:`, String(u.balance));
    if (!amt) return;
    await userAction(u.id, "set_balance", { amount: Number(amt) });
  };

  const setRole = async (u: User, role: string) => {
    if (role === u.role) return;
    if (!confirm(`Change role of ${u.username} to "${role}"?`)) return;
    await userAction(u.id, "set_role", { role });
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

  const saveStatus = async () => {
    const t = token();
    if (!t) return;
    setStatusSaving(true);
    try {
      const res = await fetch("/api/admin/status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({ state: statusState, message: statusMessage }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success("Status updated");
      } else {
        toast.error(d.error || "failed");
      }
    } finally {
      setStatusSaving(false);
    }
  };

  const saveChangelog = async () => {
    const t = token();
    if (!t) return;
    if (!clVersion || !clTitle || !clBody) {
      return toast.error("Fill version, title, and body");
    }
    setClSaving(true);
    try {
      const isEdit = !!editingId;
      const res = await fetch("/api/admin/changelog", {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
        },
        body: JSON.stringify({
          id: editingId || undefined,
          version: clVersion,
          title: clTitle,
          body: clBody,
          type: clType,
          published: clPublished,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(isEdit ? "Entry updated" : "Entry created");
        setClVersion("");
        setClTitle("");
        setClBody("");
        setClType("update");
        setClPublished(true);
        setEditingId(null);
        await loadChangelogs();
      } else {
        toast.error(d.error || "failed");
      }
    } finally {
      setClSaving(false);
    }
  };

  const editChangelog = (e: Changelog) => {
    setEditingId(e.id);
    setClVersion(e.version);
    setClTitle(e.title);
    setClBody(e.body);
    setClType(e.type);
    setClPublished(e.published);
  };

  const deleteChangelog = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const t = token();
    if (!t) return;
    await fetch("/api/admin/changelog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ id }),
    });
    await loadChangelogs();
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

  const isAdmin = me?.role === "admin" || me?.role === "founder";
  const isFounder = me?.role === "founder";

  return (
    <>
      <Starfield />
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="animate-fade-in text-3xl font-bold">Admin</h1>

        <div className="mt-6 flex flex-wrap gap-2">
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
          <button
            onClick={() => setTab("status")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              tab === "status" ? "btn-primary" : "glass text-white/70 hover:text-white"
            }`}
          >
            Status
          </button>
          <button
            onClick={() => setTab("changelog")}
            className={`rounded-lg px-4 py-2 text-sm transition ${
              tab === "changelog" ? "btn-primary" : "glass text-white/70 hover:text-white"
            }`}
          >
            Changelog ({changelogs.length})
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
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isFounderRow = u.role === "founder";
                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-white/5 ${
                        isFounderRow ? "bg-amber-500/5" : "hover:bg-white/5"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-[10px] text-white/30">
                        {u.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {u.username}
                        {isFounderRow && (
                          <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                            FOUNDER
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {isFounderRow ? (
                          "founder"
                        ) : isAdmin ? (
                          <select
                            value={u.role}
                            onChange={(e) => setRole(u, e.target.value)}
                            className="rounded border border-white/10 bg-black/40 px-2 py-1 text-xs"
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                            {isFounder && (
                              <option value="founder">founder</option>
                            )}
                          </select>
                        ) : (
                          u.role
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        {SUB_LABELS[u.subscriptionType || "none"] ||
                          u.subscriptionType ||
                          "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">
                        {u.subscriptionType?.endsWith("_lifetime")
                          ? "∞"
                          : u.subscriptionUntil
                          ? new Date(u.subscriptionUntil).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-amber-300">
                        {formatMani(u.balance)}
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
                          {!isFounderRow && (
                            <>
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
                                  <Btn onClick={() => addBalance(u)}>+Ɱ</Btn>
                                  <Btn onClick={() => removeBalance(u)}>-Ɱ</Btn>
                                  <Btn onClick={() => setBalance(u)}>=Ɱ</Btn>
                                  <Btn onClick={() => changeUsername(u)}>✎ Name</Btn>
                                  <Btn onClick={() => changePassword(u)}>✎ Pass</Btn>
                                </>
                              )}
                            </>
                          )}
                          {isFounderRow && (
                            <span className="text-xs text-white/30">protected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "invites" && (
          <>
            <div className="glass animate-fade-in mt-6 rounded-2xl p-6">
              <h2 className="text-sm uppercase tracking-wider text-white/40">
                Generate invites
              </h2>
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

        {tab === "status" && isAdmin && (
          <div className="glass animate-fade-in mt-6 rounded-2xl p-6">
            <h2 className="text-sm uppercase tracking-wider text-white/40">
              Cheat status
            </h2>
            <p className="mt-2 text-xs text-white/40">
              Set the current status of the cheat. Visible on every user's dashboard.
            </p>

            <div className="mt-6 max-w-2xl space-y-5">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                  State
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {STATUS_LIST.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatusState(s.value)}
                      className={`rounded-lg border p-3 text-left transition ${
                        statusState === s.value
                          ? "border-accent-purple bg-accent-purple/10"
                          : "border-white/10 hover:border-white/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{s.label}</span>
                        <StatusBadge state={s.value} size="sm" />
                      </div>
                      <p className="mt-1 text-[11px] text-white/40">{s.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wider text-white/40">
                  Message (optional)
                </label>
                <textarea
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="e.g. Waiting for game update..."
                  rows={3}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
                />
              </div>

              <button
                onClick={saveStatus}
                disabled={statusSaving}
                className="btn-primary rounded-lg px-6 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                {statusSaving ? "Saving..." : "Save status"}
              </button>
            </div>
          </div>
        )}

        {tab === "changelog" && isAdmin && (
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <div className="glass animate-fade-in rounded-2xl p-6 lg:col-span-2">
              <h2 className="text-sm uppercase tracking-wider text-white/40">
                {editingId ? "Edit entry" : "New entry"}
              </h2>

              <div className="mt-4 space-y-4">
                <input
                  placeholder="Version (e.g. 1.2.3)"
                  value={clVersion}
                  onChange={(e) => setClVersion(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
                />
                <input
                  placeholder="Title"
                  value={clTitle}
                  onChange={(e) => setClTitle(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
                />
                <textarea
                  placeholder="Description..."
                  value={clBody}
                  onChange={(e) => setClBody(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={clType}
                    onChange={(e) => setClType(e.target.value)}
                    className="rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
                  >
                    <option value="update">Update</option>
                    <option value="feature">Feature</option>
                    <option value="fix">Fix</option>
                    <option value="breaking">Breaking</option>
                    <option value="security">Security</option>
                  </select>
                  <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clPublished}
                      onChange={(e) => setClPublished(e.target.checked)}
                      className="accent-accent-purple"
                    />
                    Published
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveChangelog}
                    disabled={clSaving}
                    className="btn-primary flex-1 rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
                  >
                    {clSaving ? "..." : editingId ? "Save changes" : "Create"}
                  </button>
                  {editingId && (
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setClVersion("");
                        setClTitle("");
                        setClBody("");
                      }}
                      className="glass rounded-lg px-4 py-2.5 text-sm text-white/70 hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="glass animate-fade-in rounded-2xl p-6 lg:col-span-3">
              <h2 className="text-sm uppercase tracking-wider text-white/40">
                Entries ({changelogs.length})
              </h2>
              <div className="mt-4 space-y-3 max-h-[600px] overflow-y-auto">
                {changelogs.length === 0 ? (
                  <p className="text-center text-sm text-white/30 py-8">No entries yet.</p>
                ) : (
                  changelogs.map((c) => (
                    <div key={c.id} className="rounded-lg border border-white/10 p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-accent-purple">
                          {c.version}
                        </span>
                        <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase text-white/50">
                          {c.type}
                        </span>
                        {!c.published && (
                          <span className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] uppercase text-red-300">
                            draft
                          </span>
                        )}
                        <span className="ml-auto text-[10px] text-white/30">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-medium">{c.title}</div>
                      <div className="mt-1 text-xs text-white/50 line-clamp-2">{c.body}</div>
                      <div className="mt-3 flex gap-1">
                        <Btn onClick={() => editChangelog(c)}>Edit</Btn>
                        <Btn onClick={() => deleteChangelog(c.id)}>Delete</Btn>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
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
