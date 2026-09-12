"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";

export default function PasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success("Password changed");
        router.push("/dashboard");
      } else {
        toast.error(d.error || "failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Starfield />
      <Navbar />
      <main className="mx-auto max-w-md px-6 py-12">
        <h1 className="text-3xl font-bold">Change Password</h1>
        <form onSubmit={submit} className="glass mt-8 space-y-4 rounded-2xl p-6">
          <input
            type="password"
            placeholder="Current password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
            required
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-2.5 text-sm"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Saving..." : "Change Password"}
          </button>
        </form>
      </main>
    </>
  );
}
