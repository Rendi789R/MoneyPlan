import { exportTransactionsCsv } from "@/app/actions";

export async function GET() {
  try {
    const csv = await exportTransactionsCsv();
    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="transaksi-ruanguang.csv"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return Response.json({ error: "Tidak dapat mengekspor transaksi." }, { status: 401 });
  }
}
