"use client";

import { useActionState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { resendEmailOtp, verifyEmailOtp, type AuthFormState } from "@/app/actions";

export default function VerifyEmailForm({ email = "" }: { email?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<AuthFormState, FormData>(verifyEmailOtp, {});
  const [resendState, resendAction, resendPending] = useActionState<AuthFormState, FormData>(resendEmailOtp, {});
  useEffect(() => {
    if (state.success) router.push("/login?verified=1");
  }, [router, state.success]);
  return <div className="verification-wrap">
    <form action={action} className="form-panel auth-form" aria-busy={pending}>
      <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={email} placeholder="nama@email.com" /></label>
      <label>Kode verifikasi<input name="otp" inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} required placeholder="Masukkan kode dari email" /></label>
      {state.error && <p className="notice" role="alert">{state.error}</p>}
      <button className="primary-button auth-submit" type="submit" disabled={pending}>{pending ? "Memeriksa…" : "Verifikasi email"}</button>
    </form>
    <form action={resendAction} className="resend-form" aria-busy={resendPending}>
      <label>Email untuk kirim ulang<input name="email" type="email" autoComplete="email" required maxLength={254} defaultValue={email} placeholder="nama@email.com" /></label>
      <button className="secondary-button" type="submit" disabled={resendPending}>{resendPending ? "Mengirim…" : "Kirim ulang kode"}</button>
      {resendState.error && <p className="notice" role="alert">{resendState.error}</p>}
      {resendState.success && <p className="success-note" role="status">{resendState.success}</p>}
    </form>
  </div>;
}
