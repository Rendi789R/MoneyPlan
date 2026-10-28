type ExpenseItem = { category: string; total: number };

const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export default function ExpenseChart({ items }: { items: ExpenseItem[] }) {
  const visibleItems = items.filter((item) => item.total > 0).sort((a, b) => b.total - a.total);
  const total = visibleItems.reduce((sum, item) => sum + item.total, 0);

  if (visibleItems.length === 0 || total === 0) {
    return <div className="chart-empty"><p>Belum ada pengeluaran pada bulan ini.</p><span>Transaksi pengeluaran yang dicatat akan muncul di sini.</span></div>;
  }

  return <div className="expense-chart" aria-label={`Pengeluaran bulan ini, total ${rupiah.format(total)}`}>
    <div className="expense-chart-total"><span>Total pengeluaran</span><strong>{rupiah.format(total)}</strong></div>
    <ol className="expense-bars">{visibleItems.map((item) => {
      const percent = item.total / total * 100;
      return <li className="expense-bar-row" key={item.category}>
        <div className="expense-bar-heading"><span className="expense-category">{item.category}</span><span className="expense-value">{rupiah.format(item.total)} <small>{Math.round(percent)}%</small></span></div>
        <div className="expense-bar-track" role="img" aria-label={`${item.category}: ${rupiah.format(item.total)}, ${Math.round(percent)} persen`}><span style={{ width: `${percent}%` }} /></div>
      </li>;
    })}</ol>
  </div>;
}
