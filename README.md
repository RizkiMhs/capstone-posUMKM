# 🍽️ POS UMKM Kuliner - Sistem Kasir & Manajemen Keuangan Cerdas

Platform Point of Sale (POS) dan manajemen operasional modern yang dirancang khusus untuk UMKM kuliner (restoran, kafe, warung makan, kedai kopi). Dilengkapi dengan fitur kasir cepat, pencatatan modal awal laci, rekonsiliasi shift kasir (Z-Report), pemantauan stok otomatis, dan laporan laba rugi komprehensif.

---

## ✨ Fitur Utama

### 🛒 1. Point of Sale (Kasir Cepat & Responsif)
- **Katalog Menu Visual**: Filter kategori cepat, pencarian menu instan, dan indikator status stok sisa/habis.
- **Tipe Pesanan Dinamis**: Pilihan *Dine In* (dengan input nomor meja) dan *Takeaway* (bungkus).
- **Keranjang Pesanan Interaktif**: Tambah (`+`), kurang (`-`), hapus item, dan input catatan pesanan khusus per menu (cth: tidak pedas, tanpa es).
- **Pembayaran Fleksibel**: Mendukung **Tunai** (dengan tombol preset uang pas Rp 50.000, Rp 100.000, Rp 200.000 & kalkulator kembalian otomatis) serta non-tunai via **QRIS**.
- **Cetak Struk Transaksi**: Cetak langsung struk thermal 58mm dan unduh salinan digital format PDF.

### 💵 2. Manajemen Laci Kasir & Shift (Cash Float & Z-Report)
- **Buka Kasir / Modal Awal Laci**: Input nominal uang pecahan kembalian sebelum transaksi pertama dimulai.
- **Akumulasi Kas Riil**: Saldo laci kasir otomatis bertambah setiap ada transaksi tunai.
- **Tutup Kasir & Rekonsiliasi**: Kasir menghitung uang fisik di laci saat shift berakhir, sistem otomatis mengaudit status selisih kas (*Pas / Tekor / Lebih*).
- **Struk Tutup Shift (Z-Report)**: Cetak struk rekapitulasi shift kasir format thermal 58mm & PDF lengkap dengan tanda tangan serah terima.

### 📦 3. Manajemen Menu & Stok
- Tambah, edit, dan hapus katalog produk dengan foto makanan/minuman.
- Pengaturan Harga Jual, Estimasi Modal HPP, dan stok sisa yang otomatis terpotong saat transaksi berhasil.
- Manajemen kategori menu dinamis.

### 📊 4. Laporan Keuangan & HPP (Laba Rugi)
- Perhitungan **Omzet Penjualan**, **HPP Riil Bahan Baku**, dan **Beban Operasional Usaha**.
- Kalkulasi otomatis **Laba Kotor**, **Laba Bersih**, dan persentase **Food Cost (%)**.
- **Rekap Modal Laci & Shift**: Audit riwayat modal awal dan selisih uang kasir harian.
- **Ekspor Dokumen**: Unduh laporan lengkap ke format **Microsoft Excel (.xlsx)** multilembar dan dokumen resmi **PDF**.

### 📈 5. Analitik & Dashboard Usaha
- Grafik visual tren penjualan, omzet harian, dan ringkasan transaksi.
- Analisis menu terlaris (*best-seller*) dan performa kasir.

### 👥 6. Manajemen Pengguna & Keamanan
- Multi-role access: **Administrator** (akses penuh analitik & keuangan) dan **Kasir** (fokus operasional transaksi & riwayat shift).
- Otentikasi aman terintegrasi dengan **Supabase Auth** dan Row Level Security (RLS).

---

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Visualisasi & Grafik**: [Recharts](https://recharts.org/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Dokumen & Cetak**: [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/), [SheetJS (XLSX)](https://sheetjs.com/)

---

## 🚀 Panduan Instalasi Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/RizkiMhs/capstone-posUMKM.git
cd capstone-posUMKM
```

### 2. Instal Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variable
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi variabel dengan kredensial proyek Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Setup Database Supabase
Jalankan skrip SQL yang disediakan pada file `supabase_cashier_shifts.sql` melalui **SQL Editor** di Dashboard Supabase untuk mengaktifkan tabel transaksi, produk, profil, dan shift laci kasir.

### 5. Jalankan Aplikasi
```bash
npm run dev
```
Buka browser di `http://localhost:5173`.

---

## 📄 Lisensi
Proyek Capstone POS UMKM Kuliner ini dilisensikan di bawah [MIT License](LICENSE).
