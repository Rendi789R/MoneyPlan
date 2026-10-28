import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts, categories } from "@/db/schema";
import { jakartaToday } from "@/lib/format";
import { requireCurrentUser } from "@/app/actions";
import TransactionForm from "@/components/transaction-form";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  let walletRows: typeof accounts.$inferSelect[] = [];
  let categoryRows: typeof categories.$inferSelect[] = [];
  let issue = "";
  const owner = await requireCurrentUser();
  if (db) {
    try {
      [walletRows, categoryRows] = await Promise.all([
        db.select().from(accounts).where(eq(accounts.userId, owner.id)).orderBy(desc(accounts.createdAt)),
        db.select().from(categories).where(eq(categories.userId, owner.id)).orderBy(categories.name),
      ]);
      if (!categoryRows.length) issue = "Belum ada kategori. Tambahkan kategori dahulu.";
    } catch { issue = "Tidak dapat memuat dompet dan kategori. Periksa koneksi, lalu muat ulang halaman."; }
  }
  return <main className="simple-page"><header className="simple-header"><Link className="brand" href="/">ruang<span>uang</span></Link><Link className="text-link" href="/transactions">Kembali ke transaksi</Link></header><div className="simple-content"><p className="overline">CATATAN BARU</p><h1>Catat transaksi</h1><p className="subhead">Mulai dari nominal. Detail lainnya bisa dilengkapi setelahnya.</p>{issue && <p className="notice" role="alert">{issue}</p>}{!walletRows.length && !issue && <p className="notice">Tambahkan dompet sebelum mencatat transaksi.</p>}{walletRows.length > 0 && categoryRows.length > 0 && <TransactionForm wallets={walletRows.filter((row) => !row.isArchived).map(({ id, name }) => ({ id, name }))} categories={categoryRows.filter((row) => !row.isArchived).map(({ id, name, type }) => ({ id, name, type }))} today={jakartaToday()} />}{walletRows.length > 0 && !walletRows.some((row) => !row.isArchived) && <p className="notice">Semua dompet sedang diarsipkan. Aktifkan dompet di halaman <Link href="/accounts"><strong>Dompet</strong></Link> untuk melanjutkan.</p>}</div></main>;
}
