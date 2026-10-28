"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateTransaction, type TransactionFormState } from "@/app/actions";

type Tx = { id: string; type: "income" | "expense" | "transfer"; accountId: string; toAccountId: string | null; categoryId: string | null; amount: number; note: string | null; date: string };
type Wallet = { id: string; name: string };
type Category = { id: string; name: string; type: "income" | "expense" };

export default function EditTransactionForm({ transaction, wallets, categories }: { transaction: Tx; wallets: Wallet[]; categories: Category[] }) {
  const [type, setType] = useState(transaction.type);
  const [amount, setAmount] = useState(new Intl.NumberFormat("id-ID").format(transaction.amount));
  const [state, action, pending] = useActionState<TransactionFormState, FormData>(updateTransaction, {});
  const router = useRouter();
  const transfer = type === "transfer";
  useEffect(() => { if (state.success) router.push("/transactions"); }, [router, state.success]);
  return <form action={action} className="form-panel transaction-form">
    <input type="hidden" name="id" value={transaction.id} />
    <fieldset className="type-picker"><legend>Jenis transaksi</legend>{(["expense", "income", "transfer"] as const).map((value) => <label className={type === value ? "type-option is-selected" : "type-option"} key={value}><input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} /><span>{value === "expense" ? "Pengeluaran" : value === "income" ? "Pemasukan" : "Transfer"}</span></label>)}</fieldset>
    <label className="amount-field">Nominal<span className="amount-input-wrap"><span aria-hidden="true">Rp</span><input name="amount" type="text" inputMode="numeric" required value={amount} onChange={(e) => setAmount(new Intl.NumberFormat("id-ID").format(Number(e.target.value.replace(/\D/g, "")) || 0))} /></span></label>
    <div className="form-grid"><label>{transfer ? "Dari dompet" : "Dompet"}<select name="accountId" required defaultValue={transaction.accountId}>{wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
      {transfer ? <label>Ke dompet<select name="toAccountId" required defaultValue={transaction.toAccountId ?? ""}><option value="" disabled>Pilih dompet tujuan</option>{wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label> : <label>Kategori<select name="categoryId" required defaultValue={transaction.categoryId ?? ""}><option value="" disabled>Pilih kategori</option>{categories.filter((c) => c.type === type).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
      <label>Tanggal<input name="date" type="date" defaultValue={transaction.date} required /></label><label className="note-field">Catatan <span className="optional-label">Opsional</span><input name="note" defaultValue={transaction.note ?? ""} maxLength={240} /></label></div>
    {state.error && <p role="alert" className="notice">{state.error}</p>}<button className="primary-button save-transaction" type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan perubahan"}</button>
  </form>;
}
