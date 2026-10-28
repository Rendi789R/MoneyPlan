import Link from "next/link";
import { redirect } from "next/navigation";
import { getNeonAuth } from "@/lib/auth";
import AuthForm from "@/components/auth-form";
import VerifyEmailForm from "@/components/verify-email-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ verify?: string; email?: string }> }) {
  const { data: session } = await getNeonAuth.getSession();
  const params = await searchParams;
  if (session?.user?.emailVerified) redirect("/dashboard");
  const needsVerify = params.verify === "1" || Boolean(session?.user && !session.user.emailVerified);
  return <main className="login-page"><div className="login-panel"><Link className="brand" href="/">ruang<span>uang</span></Link><p className="overline">MULAI DARI SINI</p><h1>{needsVerify ? "Verifikasi emailmu." : "Buat akun pribadi."}</h1><p className="subhead">{needsVerify ? "Masukkan kode yang kami kirim ke email saat mendaftar." : "Buat akun untuk mulai menyimpan catatan keuanganmu sendiri."}</p>{needsVerify ? <VerifyEmailForm email={params.email} /> : <AuthForm mode="register" />}<p className="login-foot"><Link href="/">Kembali ke landing page</Link></p></div></main>;
}
