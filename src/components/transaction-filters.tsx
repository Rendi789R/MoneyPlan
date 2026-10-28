type Option = { id: string; name: string };

export default function TransactionFilters({ wallets, categories, values }: { wallets: Option[]; categories: Option[]; values: Record<string, string> }) {
  return <form className="transaction-filters" method="get">
    <label>Cari catatan<input name="q" type="search" maxLength={100} defaultValue={values.q} placeholder="Cari catatan" /></label>
    <label>Jenis<select name="type" defaultValue={values.type}><option value="">Semua jenis</option><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option><option value="transfer">Transfer</option></select></label>
    <label>Dompet<select name="account" defaultValue={values.account}><option value="">Semua dompet</option>{wallets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label>Kategori<select name="category" defaultValue={values.category}><option value="">Semua kategori</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label>Dari tanggal<input name="from" type="date" defaultValue={values.from} /></label>
    <label>Sampai tanggal<input name="to" type="date" defaultValue={values.to} /></label>
    <div className="filter-actions"><button className="primary-button" type="submit">Terapkan filter</button><a className="secondary-button" href="/transactions">Hapus filter</a></div>
  </form>;
}
