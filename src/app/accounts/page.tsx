import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { rupiah } from "@/lib/format";
import { addAccount } from "@/app/actions";
import { requireCurrentUser } from "@/app/actions";
import { ArchiveAccountButton } from "@/components/record-actions";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  let rows: typeof accounts.$inferSelect[] = [];
  let issue = "";
  const owner = await requireCurrentUser();
  if (db) {
    try {
      rows = await db.select().from(accounts).where(eq(accounts.userId, owner.id));
    } catch { issue = "Database belum siap. Periksa koneksi, lalu muat ulang halaman."; }
  }
  return <main className="simple-page"><header className="simple-header"><Link className="brand" href="/">ruang<span>uang</span></Link><Link className="text-link" href="/dashboard">Kembali ke ringkasan</Link></header><div className="simple-content"><p className="overline">KEUANGAN SAYA</p><h1>Dompet</h1><p className="subhead">Kelola sumber saldo yang kamu gunakan.</p>{issue && <p className="notice">{issue}</p>}<div className="record-list">{rows.length ? rows.map((row) => <div className="record-row" key={row.id}><div><strong>{row.name}</strong><small>{row.type}{row.isArchived ? " · Diarsipkan" : " · Saldo sekarang dihitung dari riwayat transaksi"}</small></div><strong>{rupiah(Number(row.initialBalance))}</strong><ArchiveAccountButton id={row.id} archived={row.isArchived} /></div>) : !issue ? <p className="empty-line">Belum ada dompet. Tambahkan dompet pertamamu di bawah.</p> : null}</div><form action={addAccount} className="form-panel"><h2>Tambah dompet</h2><label>Nama dompet<input name="name" required maxLength={80} placeholder="Contoh: Tunai" /></label><label>Jenis<select name="type" defaultValue="bank"><option value="cash">Tunai</option><option value="bank">Bank</option><option value="ewallet">E-wallet</option><option value="other">Lainnya</option></select></label><label>Saldo awal (Rupiah)<input name="initialBalance" type="number" min="0" step="1" defaultValue="0" required /></label><button className="primary-button" type="submit">Simpan dompet</button></form></div></main>;
}
