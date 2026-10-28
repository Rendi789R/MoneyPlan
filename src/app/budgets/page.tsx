import Link from "next/link";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { requireCurrentUser, upsertBudget } from "@/app/actions";
import { db } from "@/db";
import { budgets, categories, transactions } from "@/db/schema";
import { jakartaToday, rupiah } from "@/lib/format";
import BudgetLimitForm from "@/components/budget-limit-form";

export const dynamic = "force-dynamic";

export default async function BudgetsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const defaultMonth = jakartaToday().slice(0, 7);
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? "") ? params.month! : defaultMonth;
  const [year, monthNumber] = month.split("-").map(Number);
  const nextMonth = `${monthNumber === 12 ? year + 1 : year}-${String(monthNumber === 12 ? 1 : monthNumber + 1).padStart(2, "0")}-01`;
  const [allCategories, budgetRows, spending] = await Promise.all([
    db!.select().from(categories).where(and(eq(categories.userId, user.id), eq(categories.type, "expense"))).orderBy(categories.name),
    db!.select().from(budgets).where(and(eq(budgets.userId, user.id), eq(budgets.month, month))),
    db!.select({ categoryId: transactions.categoryId, amount: sql<string>`coalesce(sum(${transactions.amount}), 0)` }).from(transactions).where(and(eq(transactions.userId, user.id), eq(transactions.type, "expense"), gte(transactions.date, `${month}-01`), lt(transactions.date, nextMonth))).groupBy(transactions.categoryId),
  ]);
  const categoryRows = allCategories.filter((category, index) => allCategories.findIndex((candidate) => candidate.name.trim().toLocaleLowerCase("id-ID") === category.name.trim().toLocaleLowerCase("id-ID")) === index);
  const canonicalCategory = new Map<string, string>();
  for (const category of categoryRows) canonicalCategory.set(category.id, category.id);
  for (const category of allCategories) {
    const canonical = categoryRows.find((candidate) => candidate.name.trim().toLocaleLowerCase("id-ID") === category.name.trim().toLocaleLowerCase("id-ID"));
    if (canonical) canonicalCategory.set(category.id, canonical.id);
  }
  const spentById = new Map<string, number>();
  for (const row of spending) {
    if (row.categoryId) spentById.set(row.categoryId, (spentById.get(row.categoryId) ?? 0) + Number(row.amount));
  }
  const spent = new Map<string, number>();
  for (const [categoryId, amount] of spentById) {
    const canonicalId = canonicalCategory.get(categoryId) ?? categoryId;
    spent.set(canonicalId, (spent.get(canonicalId) ?? 0) + amount);
  }
  const budgetByCategory = new Map<string, number>();
  for (const row of budgetRows) {
    const categoryId = canonicalCategory.get(row.categoryId) ?? row.categoryId;
    budgetByCategory.set(categoryId, Math.max(budgetByCategory.get(categoryId) ?? 0, Number(row.amount)));
  }
  const displayMonth = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${month}-15T12:00:00+07:00`));
  return <main className="simple-page"><header className="simple-header"><Link className="brand" href="/">ruang<span>uang</span></Link><Link className="text-link" href="/dashboard">Kembali ke ringkasan</Link></header><div className="simple-content wide-content"><div className="budget-header"><div><p className="overline">RENCANA BULANAN</p><h1>Budget</h1><p className="subhead">Pantau pengeluaran per kategori. Angka dihitung dari transaksi tersimpan.</p></div><form method="get" className="month-picker"><label htmlFor="budget-month">Bulan</label><input id="budget-month" name="month" type="month" defaultValue={month} /></form></div><p className="period-caption">{displayMonth}</p>{categoryRows.length === 0 ? <div className="empty-state"><h3>Belum ada kategori pengeluaran</h3><p>Tambahkan kategori pengeluaran dulu supaya budget dapat dipisahkan.</p><Link className="secondary-button" href="/categories">Kelola kategori</Link></div> : <div className="budget-grid">{categoryRows.map((category) => {
    const limit = budgetByCategory.get(category.id) ?? 0;
    const amount = spent.get(category.id) ?? 0;
    const percent = limit > 0 ? Math.round((amount / limit) * 100) : 0;
    const state = limit > 0 ? percent >= 100 ? "Melewati batas" : percent >= 80 ? "Mendekati batas" : "Dalam batas" : "Belum diatur";
    return <article className="budget-item" key={category.id}><div className="budget-item-title"><div><p className="overline">KATEGORI</p><h2>{category.name}</h2></div><span className={percent >= 100 ? "budget-status over" : percent >= 80 ? "budget-status near" : "budget-status"}>{state}</span></div><div className="budget-numbers"><div><span>Terpakai</span><strong>{rupiah(amount)}</strong></div><div><span>Batas bulan ini</span><strong>{limit ? rupiah(limit) : "Belum ditetapkan"}</strong></div></div>{limit > 0 && <div className="budget-progress-block"><div className={percent >= 100 ? "budget-meter over" : "budget-meter"} role="progressbar" aria-label={`Pemakaian budget ${category.name}`} aria-valuenow={Math.min(percent, 100)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.min(percent, 100)}%` }} /></div><small>{percent}% terpakai</small></div>}<BudgetLimitForm categoryId={category.id} month={month} amount={limit} /></article>;
  })}</div>}</div></main>;
}
