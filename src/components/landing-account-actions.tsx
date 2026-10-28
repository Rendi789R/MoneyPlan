"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createAuthClient } from "@neondatabase/auth/next";

const authClient = createAuthClient();

export default function LandingAccountActions() {
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    authClient.getSession().then(({ data }) => {
      if (!active) return;
      setSignedIn(Boolean(data?.user?.email && data.user.emailVerified));
      setChecking(false);
    }).catch(() => {
      if (active) setChecking(false);
    });
    return () => { active = false; };
  }, []);

  if (checking) return <div className="landing-actions" aria-label="Memeriksa sesi"><span className="landing-auth-placeholder" /></div>;
  if (signedIn) return <div className="landing-actions"><Link href="/dashboard" className="primary-button">Buka dashboard</Link></div>;
  return <div className="landing-actions"><Link href="/login" className="login-link">Masuk</Link><Link href="/register" className="primary-button">Buat akun</Link></div>;
}
