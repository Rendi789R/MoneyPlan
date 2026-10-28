import Link from "next/link";
import { redirect } from "next/navigation";
import { getNeonAuth } from "@/lib/auth";
import AuthForm from "@/components/auth-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const { data: session } = await getNeonAuth.getSession();
  if (session?.user && session.user.emailVerified) redirect("/dashboard");
  if (session?.user && !session.user.emailVerified) redirect("/register?verify=1");
  const params = await searchParams;
  return <main className="login-page"><div className="login-panel"><Link className="brand" href="/">ruang<span>uang</span></Link><p className="overline">AKUN RUANG UANG</p><h1>Masuk ke akunmu.</h1><p className="subhead">Lanjutkan mencatat pemasukan dan pengeluaran.</p>{params.verified === "1" && <p className="success-note" role="status">Email berhasil diverifikasi. Kamu bisa masuk sekarang.</p>}<AuthForm mode="login" /><p className="login-foot"><Link href="/">Kembali ke landing page</Link></p></div></main>;
}
