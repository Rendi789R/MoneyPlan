"use client";

import { useEffect, useState } from "react";

type Summary = { signedIn: boolean; hasData?: boolean; balance?: number; income?: number; expense?: number; recent?: { type: string; amount: number; note: string | null } | null };
const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export default function LandingPreview() {
  const [summary, setSummary] = useState<Summary | null>(null);
  useEffect(() => { fetch("/api/landing-summary", { cache: "no-store" }).then((response) => response.json()).then(setSummary).catch(() => setSummary({ signedIn: false })); }, []);
  const active = summary?.signedIn && summary.hasData;
  return <div className="landing-preview" aria-label="Pratinjau dashboard Ruang Uang"><div className="preview-head"><span className="preview-brand">ruang<span>uang</span></span><span className="preview-period">Ringkasan bulanan</span></div>{active ? <><div className="preview-balance"><span>Total saldo</span><strong>{money(summary.balance ?? 0)}</strong><small>Data dari akunmu</small></div><div className="preview-flow"><div><span>Pemasukan</span><strong>{money(summary.income ?? 0)}</strong></div><div><span>Pengeluaran</span><strong>{money(summary.expense ?? 0)}</strong></div></div><div className="preview-activity"><div className="preview-activity-head"><strong>Transaksi terbaru</strong><span>Akunmu</span></div><div className="preview-active-row"><span className="preview-active-mark">{summary.recent?.type === "income" ? "+" : "−"}</span><p>{summary.recent?.note || "Catatan bulan ini"}</p><strong>{money(summary.recent?.amount ?? 0)}</strong></div></div></> : <><div className="preview-balance preview-placeholder"><span>{summary?.signedIn ? "Siapkan ringkasanmu" : "Ringkasan pribadimu"}</span><strong>{summary?.signedIn ? "Mulai dari sini" : "Masuk untuk melihat"}</strong><small>{summary?.signedIn ? "Tambahkan dompet atau transaksi pertama" : "Data hanya tampil setelah login"}</small></div><div className="preview-flow"><div><span>Pemasukan</span><strong className="placeholder-text">Belum ada data</strong></div><div><span>Pengeluaran</span><strong className="placeholder-text">Belum ada data</strong></div></div><div className="preview-empty"><span className="preview-empty-mark">+</span><p>{summary?.signedIn ? "Catat transaksi pertama" : "Masuk untuk mulai mencatat"}</p></div></>}</div>;
}
