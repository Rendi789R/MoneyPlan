import Link from "next/link";
import { eq } from "drizzle-orm";
import { rupiah } from "@/lib/format";
import { listFilteredTransactions, requireCurrentUser } from "@/app/actions";
import { db } from "@/db";
import { accounts, categories } from "@/db/schema";
import TransactionFilters from "@/components/transaction-filters";
import DeleteTransactionButton from "@/components/delete-transaction-button";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const values = {
    type: typeof params.type === "string" ? params.type : "",
    from: typeof params.from === "string" ? params.from : "",
    to: typeof params.to === "string" ? params.to : "",
    account: typeof params.account === "string" ? params.account : "",
    category: typeof params.category === "string" ? params.category : "",
    q: typeof params.q === "string" ? params.q : "",
  };
  const owner = await requireCurrentUser();
  const [rows, wallets, categoryOptions] = await Promise.all([
    listFilteredTransactions({ type: values.type, from: values.from, to: values.to, accountId: values.account, categoryId: values.category, search: values.q }),
    db!.select({ id: accounts.id, name: accounts.name }).from(accounts).where(eq(accounts.userId, owner.id)),
    db!.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.userId, owner.id)),
  ]);
  const filtered = Object.values(values).some(Boolean);

  return <main className="simple-page"><header className="simple-header"><Link className="brand" href="/">ruang<span>uang</span></Link><Link className="text-link" href="/dashboard">Kembali ke ringkasan</Link></header><div className="simple-content wide-content"><div className="page-heading"><div><p className="overline">CATATAN KEUANGAN</p><h1>Transaksi</h1><p className="subhead">Pemasukan, pengeluaran, dan perpindahan antar dompet.</p></div><div className="transaction-page-actions"><a className="secondary-button" href="/api/export">Ekspor CSV</a><Link className="primary-button" href="/transactions/new">+ Catat transaksi</Link></div></div><TransactionFilters wallets={wallets} categories={categoryOptions} values={values} />{rows.length ? <div className="record-list">{rows.map(({ transaction: tx, account, category }) => <div className="record-row" key={tx.id}><div><strong>{tx.note || category?.name || (tx.type === "transfer" ? "Transfer" : "Transaksi")}</strong><small>{tx.date} · {account?.name}{category ? ` · ${category.name}` : ""}</small></div><strong className={tx.type === "expense" ? "amount-out" : "amount-in"}>{tx.type === "expense" ? "−" : tx.type === "income" ? "+" : "↔"}{rupiah(Number(tx.amount))}</strong><div className="record-actions"><Link className="record-action" href={`/transactions/${tx.id}/edit`}>Edit</Link><DeleteTransactionButton id={tx.id} /></div></div>)}</div> : <div className="empty-state"><h3>{filtered ? "Tidak ada transaksi yang cocok" : "Belum ada transaksi"}</h3><p>{filtered ? "Ubah filter atau hapus pencarian untuk melihat catatan lain." : "Transaksi yang kamu catat akan muncul di sini."}</p><Link href="/transactions/new" className="secondary-button">Catat transaksi</Link></div>}</div></main>;
}
