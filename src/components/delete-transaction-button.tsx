"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteTransaction } from "@/app/actions";

export default function DeleteTransactionButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return <form action={async () => {
    if (!window.confirm("Hapus transaksi ini? Tindakan ini tidak dapat dibatalkan.")) return;
    setPending(true);
    const data = new FormData(); data.set("id", id);
    await deleteTransaction(data);
    router.refresh();
    setPending(false);
  }}><button className="record-action danger-action" type="submit" disabled={pending}>{pending ? "Menghapus…" : "Hapus"}</button></form>;
}
