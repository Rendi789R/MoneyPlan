"use client";

import { useState } from "react";
import { addTransaction, type TransactionFormState } from "@/app/actions";
import { useActionState, useEffect } from "react";

type Wallet = { id: string; name: string };
type Category = { id: string; name: string; type: "income" | "expense" };

export default function TransactionForm({ wallets, categories, today }: { wallets: Wallet[]; categories: Category[]; today: string }) {
  const [type, setType] = useState<"expense" | "income" | "transfer">("expense");
  const [state, action, pending] = useActionState<TransactionFormState, FormData>(addTransaction, {});
  const [amount, setAmount] = useState("");
  const shownCategories = categories.filter((category) => category.type === type);
  const isTransfer = type === "transfer";
  const formatAmount = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits ? new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(digits)) : "";
  };

  function updateAmount(value: string) {
    const digits = value.replace(/\D/g, "");
    setAmount(formatAmount(digits));
  }

  useEffect(() => {
    if (state.success) setAmount("");
  }, [state.success]);

  return <form action={action} className="form-panel transaction-form" autoComplete="off">
    <fieldset className="type-picker">
      <legend>Jenis transaksi</legend>
      {(["expense", "income", "transfer"] as const).map((value) => <label className={type === value ? "type-option is-selected" : "type-option"} key={value}>
        <input type="radio" name="type" value={value} checked={type === value} onChange={() => setType(value)} />
        <span>{value === "expense" ? "Pengeluaran" : value === "income" ? "Pemasukan" : "Transfer"}</span>
      </label>)}
    </fieldset>

    <label className="amount-field">Nominal
      <span className="amount-input-wrap"><span aria-hidden="true">Rp</span><input aria-label="Nominal dalam Rupiah" name="amount" type="text" inputMode="numeric" autoFocus required placeholder="0" value={amount} onChange={(event) => updateAmount(event.target.value)} /></span>
    </label>
    <div className="quick-amounts" aria-label="Pilihan nominal cepat">
      {(type === "income" ? ["1000000", "2500000", "5000000", "10000000"] : ["10000", "25000", "50000", "100000"]).map((amount) => <button key={amount} type="button" onClick={(event) => {
        const input = event.currentTarget.closest("form")?.elements.namedItem("amount") as HTMLInputElement | null;
        if (input) updateAmount(amount);
      }}>Rp {Number(amount).toLocaleString("id-ID")}</button>)}
    </div>

    <div className="form-grid">
      <label>{isTransfer ? "Dari dompet" : "Dompet"}<select name="accountId" required defaultValue=""><option value="" disabled>Pilih dompet</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label>
      {isTransfer ? <label>Ke dompet<select name="toAccountId" required defaultValue=""><option value="" disabled>Pilih dompet tujuan</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label> : <label>Kategori<select name="categoryId" required defaultValue=""><option value="" disabled>Pilih kategori</option>{shownCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>}
      <label>Tanggal<input type="date" name="date" defaultValue={today} required /></label>
      <label className="note-field">Catatan <span className="optional-label">Opsional</span><input name="note" maxLength={240} placeholder={type === "income" ? "Contoh: gaji bulanan" : isTransfer ? "Contoh: pindah ke tabungan" : "Contoh: makan siang"} /></label>
    </div>
    {state.error && <p className="notice" role="alert">{state.error}</p>}
    {state.success && <p className="success-note" role="status">{state.success}</p>}
    <button className="primary-button save-transaction" type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Simpan transaksi"}</button>
    <p className="form-hint">Nominal dicatat dalam Rupiah, tanpa desimal.</p>
  </form>;
}
