"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/creator/api";
import { fetchMe, homeFor, nextParam, notifyAuthChange, type User } from "@/lib/auth";
import { AuthCard, AuthLink, Field, FormError, SubmitButton } from "@/components/auth/AuthCard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchMe().then((u) => u && router.replace(nextParam(homeFor(u))));
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { user } = await apiPost<{ user: User }>("/auth/login", { email, password });
      notifyAuthChange();
      router.push(nextParam(homeFor(user)));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Log in" subtitle="Welcome back to Bainsla Tools" footer={<>New here? <AuthLink href="/signup">Create an account</AuthLink></>}>
      <form onSubmit={submit}>
        <FormError msg={err} />
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="-mt-2 mb-5 text-right text-sm">
          <AuthLink href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}>Forgot password?</AuthLink>
        </div>
        <SubmitButton busy={busy}>Log in</SubmitButton>
      </form>
    </AuthCard>
  );
}
