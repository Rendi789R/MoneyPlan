import Link from "next/link";
import LandingAccountActions from "@/components/landing-account-actions";
import LandingPreview from "@/components/landing-preview";

export default function Home() {
  return <main className="landing-page">
    <header className="landing-nav"><Link className="brand" href="/">ruang<span>uang</span></Link><nav aria-label="Navigasi landing"><a href="#cara-kerja">Cara kerja</a><a href="#privasi">Privasi</a></nav><LandingAccountActions /></header>
    <section className="landing-hero"><div className="hero-copy"><p className="overline">UANGMU, LEBIH TERATUR</p><h1>Catat hari ini.<br /><span>Pahami kebiasaanmu.</span></h1><p className="hero-description">Satu tempat untuk mencatat pemasukan, pengeluaran, dan saldo setiap dompet. Mulai dari catatan sederhana, tanpa spreadsheet yang berantakan.</p><div className="hero-actions"><Link href="/register" className="primary-button">Buat akun gratis</Link><Link href="/login" className="secondary-button">Saya sudah punya akun</Link></div><p className="hero-footnote">Data tiap akun tersimpan terpisah.</p></div><LandingPreview /></section>
    <section id="cara-kerja" className="landing-details"><div className="details-intro"><p className="overline">DIBUAT UNTUK CATATAN HARIAN</p><h2>Keuangan pribadi, tanpa langkah yang berlebihan.</h2></div><div className="details-list"><article><span className="detail-index">01</span><div><h3>Catat dengan cepat</h3><p>Masukkan nominal, pilih dompet, lalu simpan. Tanggal terisi otomatis.</p></div></article><article><span className="detail-index">02</span><div><h3>Pisahkan setiap dompet</h3><p>Kelola uang tunai, rekening, dan e-wallet dalam satu tampilan.</p></div></article><article><span className="detail-index">03</span><div><h3>Lihat arus uangmu</h3><p>Ringkasan berasal dari catatanmu sendiri.</p></div></article></div></section>
    <section id="privasi" className="privacy-note"><div><p className="overline">AKUN PRIBADI</p><h2>Catatan keuanganmu milikmu.</h2><p>Setiap akun hanya dapat melihat dompet, kategori, dan transaksi yang dibuat oleh akun itu.</p></div><Link href="/register" className="primary-button">Mulai mencatat</Link></section><footer className="landing-footer"><Link className="brand" href="/">ruang<span>uang</span></Link><span>Catatan keuangan pribadi.</span><Link href="/login">Masuk ke akun</Link></footer>
  </main>;
}
