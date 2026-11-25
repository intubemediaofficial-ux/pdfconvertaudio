"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/creator/api";
import { homeFor, notifyAuthChange, type User } from "@/lib/auth";
import { AuthCard, AuthLink, Field, FormError, FormNote, SubmitButton } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const e = new URLSearchParams(window.location.search).get("email");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (e) setEmail(e);
  }, []);

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setErr("");
    setNote("");
    setBusy(true);
    try {
      await apiPost("/auth/forgot", { email });
      setStep("otp");
      setNote(`If an account exists for ${email}, a 6-digit OTP has been sent. Check your inbox and spam folder.`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password !== confirm) return setErr("Passwords don't match.");
    setBusy(true);
    try {
      const { user } = await apiPost<{ user: User }>("/auth/reset", { email, otp, password });
      notifyAuthChange();
      router.push(homeFor(user));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      title="Reset password"
      subtitle={step === "email" ? "We'll email you a one-time code" : "Enter the code from your email"}
      footer={<>Remembered it? <AuthLink href="/login">Log in</AuthLink></>}
    >
      {step === "email" ? (
        <form onSubmit={sendOtp}>
          <FormError msg={err} />
          <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <SubmitButton busy={busy}>Send OTP</SubmitButton>
        </form>
      ) : (
        <form onSubmit={reset}>
          <FormNote msg={note} />
          <FormError msg={err} />
          <Field label="6-digit OTP" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
          <Field label="New password (min 8 characters)" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Field label="Confirm new password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <SubmitButton busy={busy}>Change password</SubmitButton>
          <div className="mt-4 flex justify-between text-sm">
            <button type="button" className="font-semibold text-gray-600 hover:underline" onClick={() => { setStep("email"); setErr(""); setNote(""); }}>Change email</button>
            <button type="button" disabled={busy} className="font-semibold text-pink-600 hover:underline" onClick={() => sendOtp()}>Resend OTP</button>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
