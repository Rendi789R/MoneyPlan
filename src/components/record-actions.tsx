"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { archiveAccount, archiveCategory } from "@/app/actions";

export function ArchiveAccountButton({ id, archived }: { id: string; archived: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return <form action={async () => {
    if (archived || !window.confirm("Arsipkan dompet ini? Saldo dan riwayat transaksi tetap tersimpan.")) return;
    setPending(true);
    const data = new FormData(); data.set("id", id);
    await archiveAccount(data);
    router.refresh();
    setPending(false);
  }}><button className="record-action" type="submit" disabled={pending || archived}>{archived ? "Diarsipkan" : pending ? "Menyimpan…" : "Arsipkan"}</button></form>;
}

export function ArchiveCategoryButton({ id, archived }: { id: string; archived: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return <form action={async () => {
    if (archived || !window.confirm("Arsipkan kategori ini? Kategori tidak akan muncul saat mencatat transaksi baru.")) return;
    setPending(true);
    const data = new FormData(); data.set("id", id);
    await archiveCategory(data);
    router.refresh();
    setPending(false);
  }}><button className="record-action" type="submit" disabled={pending || archived}>{archived ? "Diarsipkan" : pending ? "Menyimpan…" : "Arsipkan"}</button></form>;
}
