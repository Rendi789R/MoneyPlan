"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { upsertBudget } from "@/app/actions";

function SaveBudgetButton({ hasBudget }: { hasBudget: boolean }) {
  const { pending } = useFormStatus();
  return <button className="budget-save" type="submit" disabled={pending}>{pending ? "Menyimpan…" : hasBudget ? "Perbarui batas" : "Tetapkan batas"}</button>;
}

export default function BudgetLimitForm({ categoryId, month, amount }: { categoryId: string; month: string; amount: number }) {
  const [value, setValue] = useState(amount ? new Intl.NumberFormat("id-ID").format(amount) : "");
  return <form action={upsertBudget} className="budget-form">
    <input type="hidden" name="categoryId" value={categoryId} />
    <input type="hidden" name="month" value={month} />
    <label htmlFor={`budget-${categoryId}`}>Batas pengeluaran</label>
    <div className="budget-input-row"><div className="budget-input-wrap"><span aria-hidden="true">Rp</span><input id={`budget-${categoryId}`} name="amount" type="text" inputMode="numeric" autoComplete="off" required value={value} placeholder="0" onChange={(event) => {
      const digits = event.target.value.replace(/\D/g, "");
      setValue(digits ? new Intl.NumberFormat("id-ID").format(Number(digits)) : "");
    }} /></div><SaveBudgetButton hasBudget={amount > 0} /></div>
    <small className="budget-form-hint">Batas ini berlaku untuk {month}.</small>
  </form>;
}
