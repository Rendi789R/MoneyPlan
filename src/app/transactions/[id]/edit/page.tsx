import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnedWalletsAndCategories, getTransactionForEdit } from "@/app/actions";
import EditTransactionForm from "@/components/edit-transaction-form";

export const dynamic = "force-dynamic";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [transaction, options] = await Promise.all([getTransactionForEdit(id), getOwnedWalletsAndCategories()]);
  if (!transaction) notFound();
  return <main className="simple-page"><header className="simple-header"><Link className="brand" href="/">ruang<span>uang</span></Link><Link className="text-link" href="/transactions">Kembali ke transaksi</Link></header><div className="simple-content"><p className="overline">PERBARUI CATATAN</p><h1>Edit transaksi</h1><p className="subhead">Perubahan akan memperbarui ringkasan saldo dan aktivitas.</p><EditTransactionForm transaction={transaction} wallets={options.wallets} categories={options.categories} /></div></main>;
}
