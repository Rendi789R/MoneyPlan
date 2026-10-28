import Link from "next/link";
import { redirect } from "next/navigation";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getNeonAuth } from "@/lib/auth";
import { getMonthlyExpenseByCategory, requireCurrentUser, signOut } from "@/app/actions";
import { db } from "@/db";
import { accounts, transactions } from "@/db/schema";
import { jakartaToday, rupiah } from "@/lib/format";
import ExpenseChart from "@/components/expense-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const { data: session } = await getNeonAuth.getSession();
  if (!session?.user?.email) redirect("/login");

  let overview: { balance: number; income: number; expense: number; count: number; recent: { id: string; type: "income" | "expense" | "transfer"; amount: number; note: string | null; date: string }[] } | null = null;
  const today = jakartaToday();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [year, monthNumber] = today.slice(0, 7).split("-").map(Number);
  const monthKey = today.slice(0, 7);
  const monthEnd = `${monthNumber === 12 ? year + 1 : year}-${String(monthNumber === 12 ? 1 : monthNumber + 1).padStart(2, "0")}-01`;
  let expenseByCategory: { category: string; total: number }[] = [];
  try {
    const owner = user;
    if (owner) {
      const [accountRows, txRows, [monthly], recent] = await Promise.all([
        db!.select().from(accounts).where(eq(accounts.userId, owner.id)),
        db!.select({ accountId: transactions.accountId, toAccountId: transactions.toAccountId, type: transactions.type, amount: transactions.amount }).from(transactions).where(eq(transactions.userId, owner.id)),
        db!.select({ income: sql<string>`coalesce(sum(case when ${transactions.type} = 'income' then ${transactions.amount} else 0 end), 0)`, expense: sql<string>`coalesce(sum(case when ${transactions.type} = 'expense' then ${transactions.amount} else 0 end), 0)`, count: sql<number>`count(*)` }).from(transactions).where(and(eq(transactions.userId, owner.id), gte(transactions.date, monthStart), lt(transactions.date, monthEnd))),
        db!.select({ id: transactions.id, type: transactions.type, amount: transactions.amount, note: transactions.note, date: transactions.date }).from(transactions).where(and(eq(transactions.userId, owner.id), gte(transactions.date, monthStart), lt(transactions.date, monthEnd))).orderBy(desc(transactions.date), desc(transactions.createdAt)).limit(5),
      ]);
      const balance = accountRows.reduce((sum, account) => sum + Number(account.initialBalance) + txRows.filter((tx) => tx.accountId === account.id || tx.toAccountId === account.id).reduce((accountSum, tx) => accountSum + (tx.type === "income" ? Number(tx.amount) : tx.type === "expense" ? -Number(tx.amount) : tx.toAccountId === account.id ? Number(tx.amount) : -Number(tx.amount)), 0), 0);
      overview = { balance, income: Number(monthly?.income ?? 0), expense: Number(monthly?.expense ?? 0), count: Number(monthly?.count ?? 0), recent };
       expenseByCategory = await getMonthlyExpenseByCategory(monthKey);
    }
  } catch {
    overview = null;
  }

  const currentMonth = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date());
  return <main className="shell">
    <aside className="rail"><Link className="brand" href="/">ruang<span>uang</span></Link><div className="rail-label">MENU</div><nav aria-label="Navigasi utama"><Link className="nav-item active" href="/dashboard">⌂ <span>Ringkasan</span></Link><Link className="nav-item" href="/transactions">↕ <span>Transaksi</span></Link><Link className="nav-item" href="/accounts">▤ <span>Dompet</span></Link><Link className="nav-item" href="/categories">◷ <span>Kategori</span></Link><Link className="nav-item" href="/budgets">▥ <span>Budget</span></Link></nav><div className="rail-foot"><span className="avatar">{session.user.name?.[0] ?? session.user.email[0].toUpperCase()}</span><div><strong>{session.user.name ?? "Akun saya"}</strong><small>{session.user.email}</small></div><form action={signOut}><button className="icon-button" type="submit">Keluar</button></form></div></aside>
    <section className="main-area"><header className="topbar"><div className="crumb">Keuangan <span>/</span> Ringkasan</div><span className="date-label">{currentMonth}</span></header><div className="content"><div className="page-heading"><div><p className="overline">DASHBOARD</p><h1>Halo, {session.user.name?.split(" ")[0] ?? "selamat datang"}.</h1><p className="subhead">Berikut ringkasan keuanganmu bulan ini.</p></div><Link href="/transactions/new" className="primary-button">+ Catat transaksi</Link></div>
      {!overview && <p className="notice" role="alert">Ringkasan belum dapat dimuat. Periksa koneksi database lalu muat ulang halaman.</p>}
      <div className="overview-grid"><article className="balance-panel"><div className="panel-top"><span className="panel-label">TOTAL SALDO</span><span className="balance-mark">IDR</span></div><div className="balance-number">{rupiah(overview?.balance ?? 0)}</div><div className="balance-note">Saldo gabungan semua dompet</div><div className="balance-rule"/><Link href="/accounts" className="text-link">Kelola dompet <span>↗</span></Link></article><article className="summary-panel"><div className="summary-heading"><span className="panel-label">ARUS BULAN INI</span><span className="summary-period">{currentMonth}</span></div><div className="flow-row"><div className="flow-symbol income-symbol">↓</div><div><small>Pemasukan</small><strong>{rupiah(overview?.income ?? 0)}</strong></div></div><div className="flow-divider"/><div className="flow-row"><div className="flow-symbol expense-symbol">↑</div><div><small>Pengeluaran</small><strong>{rupiah(overview?.expense ?? 0)}</strong></div></div></article></div>
      <section className="expense-chart-section"><div className="section-heading"><div><p className="overline">PEMBAGIAN PENGELUARAN</p><h2>Ke mana uangmu pergi?</h2></div><span className="summary-period">{currentMonth}</span></div><ExpenseChart items={expenseByCategory} /></section>
      <section className="transactions-section"><div className="section-heading"><div><p className="overline">AKTIVITAS</p><h2>Transaksi terbaru</h2></div><Link className="text-link" href="/transactions">Lihat semua <span>↗</span></Link></div>{overview?.count ? <div className="recent-list">{overview.recent.map((tx) => <div className="recent-row" key={tx.id}><div><strong>{tx.note || (tx.type === "income" ? "Pemasukan" : tx.type === "transfer" ? "Transfer" : "Pengeluaran")}</strong><small>{tx.date} · {tx.type === "income" ? "Pemasukan" : tx.type === "transfer" ? "Transfer" : "Pengeluaran"}</small></div><strong className={tx.type === "expense" ? "amount-out" : "amount-in"}>{tx.type === "expense" ? "−" : tx.type === "income" ? "+" : "↔"}{rupiah(Number(tx.amount))}</strong></div>)}</div> : <div className="empty-state"><div className="empty-mark">+</div><h3>Belum ada transaksi</h3><p>Catat pemasukan atau pengeluaran pertama untuk melihat pergerakan uangmu di sini.</p><Link href="/transactions/new" className="secondary-button">Catat transaksi pertama</Link></div>}</section><footer className="footer-note">Ruang Uang <span>·</span> Catatan keuangan pribadi.</footer></div></section>
    <nav className="mobile-nav" aria-label="Navigasi mobile"><Link className="selected" href="/dashboard">⌂<span>Ringkasan</span></Link><Link href="/transactions">↕<span>Transaksi</span></Link><Link href="/accounts">▤<span>Dompet</span></Link><Link href="/budgets">▥<span>Budget</span></Link></nav>
  </main>;
}
