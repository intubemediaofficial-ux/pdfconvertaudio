"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/creator/api";
import { logout, useMe } from "@/lib/auth";
import { AuthCard, Field, FormError, FormNote, SubmitButton } from "@/components/auth/AuthCard";

export default function AccountPage() {
  const router = useRouter();
  const user = useMe();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user === null) router.replace("/login?next=/account");
  }, [user, router]);

  async function change(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setNote("");
    if (password !== confirm) return setErr("Passwords don't match.");
    setBusy(true);
    try {
      await apiPost("/auth/change-password", { current, password });
      setNote("Password changed. Other devices have been logged out.");
      setCurrent("");
      setPassword("");
      setConfirm("");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <div className="tool-container text-center text-gray-500">Loading…</div>;

  return (
    <AuthCard title="My account" subtitle={user.email}>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">{user.name || "No name"}</span>
        <span className={`rounded-full px-3 py-1 font-semibold ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-pink-50 text-pink-600"}`}>
          {user.role === "admin" ? "Admin" : "User"}
        </span>
        {user.role === "admin" && (
          <Link href="/admin" className="ml-auto font-semibold text-purple-700 hover:underline">Open admin panel →</Link>
        )}
      </div>
      <h2 className="font-bold text-gray-900 mb-3">Change password</h2>
      <form onSubmit={change}>
        <FormNote msg={note} />
        <FormError msg={err} />
        <Field label="Current password" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Field label="New password (min 8 characters)" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <SubmitButton busy={busy}>Change password</SubmitButton>
      </form>
      <p className="mt-3 text-center text-sm text-gray-500">
        Forgot your current password? <Link href={`/forgot-password?email=${encodeURIComponent(user.email)}`} className="font-semibold text-pink-600 hover:underline">Reset with email OTP</Link>
      </p>
      <button
        type="button"
        onClick={async () => { await logout(); router.push("/"); }}
        className="mt-6 w-full rounded-xl border-2 border-gray-200 py-3 font-semibold text-gray-700 hover:border-red-300 hover:text-red-600"
      >
        Log out
      </button>
    </AuthCard>
  );
}
