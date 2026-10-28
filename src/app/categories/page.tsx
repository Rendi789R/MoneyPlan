import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { addCategory } from "@/app/actions";
import { requireCurrentUser } from "@/app/actions";
import { ArchiveCategoryButton } from "@/components/record-actions";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  let rows: typeof categories.$inferSelect[] = [];
  let issue = "";
  const owner = await requireCurrentUser();
  if (db) {
    try {
      rows = await db.select().from(categories).where(eq(categories.userId, owner.id));
    } catch { issue = "Database belum siap. Periksa koneksi, lalu muat ulang halaman."; }
  }
  return <main className="simple-page"><header className="simple-header"><Link className="brand" href="/">ruang<span>uang</span></Link><Link className="text-link" href="/dashboard">Kembali ke ringkasan</Link></header><div className="simple-content"><p className="overline">PENGATURAN</p><h1>Kategori</h1><p className="subhead">Kelompokkan transaksi agar arus uang mudah dipahami.</p>{issue && <p className="notice">{issue}</p>}<div className="record-list">{rows.length ? rows.map((row) => <div className="record-row" key={row.id}><strong>{row.name}</strong><span className="type-tag">{row.type === "income" ? "Pemasukan" : "Pengeluaran"}</span><ArchiveCategoryButton id={row.id} archived={row.isArchived} /></div>) : !issue ? <p className="empty-line">Belum ada kategori. Buat kategori pertamamu di bawah.</p> : null}</div><form action={addCategory} className="form-panel"><h2>Tambah kategori</h2><label>Nama kategori<input name="name" required maxLength={60} placeholder="Contoh: Makan" /></label><label>Jenis<select name="type" defaultValue="expense"><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label><button className="primary-button" type="submit">Simpan kategori</button></form></div></main>;
}
