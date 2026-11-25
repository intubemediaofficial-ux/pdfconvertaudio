"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/creator/api";
import { homeFor, notifyAuthChange, type User } from "@/lib/auth";
import { AuthCard, AuthLink, Field, FormError, SubmitButton } from "@/components/auth/AuthCard";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password !== confirm) return setErr("Passwords don't match.");
    setBusy(true);
    try {
      const { user } = await apiPost<{ user: User }>("/auth/signup", { name, email, password });
      notifyAuthChange();
      router.push(homeFor(user));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create account" subtitle="All tools stay free — an account is optional" footer={<>Already have an account? <AuthLink href="/login">Log in</AuthLink></>}>
      <form onSubmit={submit}>
        <FormError msg={err} />
        <Field label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password (min 8 characters)" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Field label="Confirm password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
