"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useEffect } from "react";
import { registerWithEmail, signInWithEmail, type AuthFormState } from "@/app/actions";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(mode === "register" ? registerWithEmail : signInWithEmail, {});
  useEffect(() => {
    if (state.success && state.email && mode === "register") {
      window.location.assign(`/register?verify=1&email=${encodeURIComponent(state.email)}`);
    }
  }, [mode, state.email, state.success]);

  return <form action={action} className="form-panel auth-form" aria-busy={pending}>
    {mode === "register" && <label>Nama<input name="name" type="text" autoComplete="name" minLength={2} maxLength={80} required placeholder="Nama kamu" /></label>}
    <label>Email<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="nama@email.com" /></label>
    <label>Kata sandi<input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={8} maxLength={128} required placeholder="Minimal 8 karakter" /></label>
    {state.error && <p className="notice" role="alert">{state.error}</p>}
    {state.success && !(mode === "register" && state.email) && <p className="success-note" role="status">{state.success}</p>}
    <button className="primary-button auth-submit" type="submit" disabled={pending}>{pending ? "Memproses…" : mode === "register" ? "Buat akun" : "Masuk"}</button>
    <p className="auth-switch">{mode === "register" ? "Sudah punya akun?" : "Belum punya akun?"} <Link href={mode === "register" ? "/login" : "/register"}>{mode === "register" ? "Masuk" : "Buat akun"}</Link></p>
  </form>;
}
