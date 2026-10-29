import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../utils/formatRupiah';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { getStoreSettings } from '../../utils/storeSettings';
import {
  Calendar,
  FileSpreadsheet,
  FileDown,
  Plus,
  Trash2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
  Loader2,
  ShoppingBag,
} from 'lucide-react';

export default function FinanceReport() {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [shifts, setShifts] = useState([]);

  // Form Expense
  const [expenseForm, setExpenseForm] = useState({
    expense_date: today,
    category: 'Bahan Baku',
    description: '',
    amount: '',
  });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const startIso = `${startDate}T00:00:00.000Z`;
      const endIso = `${endDate}T23:59:59.999Z`;

      const [txRes, expRes, shiftRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*, transaction_items(*)')
          .gte('created_at', startIso)
          .lte('created_at', endIso)
          .order('created_at', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .gte('expense_date', startDate)
          .lte('expense_date', endDate)
          .order('expense_date', { ascending: false }),
        supabase
          .from('cashier_shifts')
          .select('*, profiles(name)')
          .gte('opened_at', startIso)
          .lte('opened_at', endIso)
          .order('opened_at', { ascending: false }),
      ]);

      if (txRes.error) throw txRes.error;
      if (expRes.error) throw expRes.error;
      if (shiftRes.error) throw shiftRes.error;

      setTransactions(txRes.data || []);
      setExpenses(expRes.data || []);
      setShifts(shiftRes.data || []);
    } catch (err) {
      alert('Gagal mengambil data laporan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description) return;
    setSubmittingExpense(true);
    try {
      const { error } = await supabase.from('expenses').insert([
        {
          expense_date: expenseForm.expense_date,
          category: expenseForm.category,
          description: expenseForm.description,
          amount: Number(expenseForm.amount),
        },
      ]);
      if (error) throw error;
      setExpenseForm({
        expense_date: today,
        category: 'Bahan Baku',
        description: '',
        amount: '',
      });
      fetchData();
    } catch (err) {
      alert('Gagal menambah pengeluaran: ' + err.message);
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Hapus catatan pengeluaran ini?')) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('Gagal menghapus pengeluaran: ' + err.message);
    }
  };

  // 1. Total Omzet
  const totalOmzet = transactions.reduce((acc, tx) => acc + Number(tx.total_amount || 0), 0);

  // 2. Total Porsi Terjual
  const totalPortionsSold = transactions.reduce((acc, tx) => {
    const txQty = (tx.transaction_items || []).reduce((sub, item) => sub + (item.qty || 1), 0);
    return acc + txQty;
  }, 0);

  // 3. HPP Riil (Total Belanja Bahan Baku)
  const hppBahanBaku = expenses
    .filter((exp) => exp.category === 'Bahan Baku')
    .reduce((acc, exp) => acc + Number(exp.amount || 0), 0);

  // 4. Beban Operasional Usaha
  const bebanOperasional = expenses
    .filter((exp) => exp.category !== 'Bahan Baku')
    .reduce((acc, exp) => acc + Number(exp.amount || 0), 0);

  // 5. Total Seluruh Pengeluaran Kas
  const totalPengeluaran = hppBahanBaku + bebanOperasional;

  // 6. Laba Kotor & Laba Bersih
  const labaKotor = totalOmzet - hppBahanBaku;
  const labaBersih = labaKotor - bebanOperasional;

  // 7. Indikator Tambahan
  const foodCostPercent = totalOmzet > 0 ? ((hppBahanBaku / totalOmzet) * 100).toFixed(1) : 0;
  const hppPerPorsi = totalPortionsSold > 0 ? Math.round(hppBahanBaku / totalPortionsSold) : 0;

  // 8. Rekap Shift & Laci Kasir
  const totalModalAwal = shifts.reduce((sum, s) => sum + Number(s.starting_cash || 0), 0);
  const totalShiftCash = shifts.reduce((sum, s) => sum + Number(s.cash_sales || 0), 0);
  const totalShiftExpected = shifts.reduce((sum, s) => sum + Number(s.expected_cash || 0), 0);
  const totalShiftActual = shifts.reduce((sum, s) => sum + Number(s.actual_cash || 0), 0);
  const totalDiscrepancy = shifts.reduce((sum, s) => sum + Number(s.discrepancy || 0), 0);

  // Export ke Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan
    const summaryData = [
      { Indikator: 'Periode Awal', Nilai: startDate },
      { Indikator: 'Periode Akhir', Nilai: endDate },
      { Indikator: 'Total Omzet (Penjualan Kasir)', Nilai: totalOmzet },
      { Indikator: 'Total Porsi Menu Terjual', Nilai: totalPortionsSold },
      { Indikator: 'HPP Riil (Belanja Bahan Baku)', Nilai: hppBahanBaku },
      { Indikator: 'Food Cost (%)', Nilai: `${foodCostPercent}%` },
      { Indikator: 'HPP Rata-rata per Porsi', Nilai: hppPerPorsi },
      { Indikator: 'Laba Kotor', Nilai: labaKotor },
      { Indikator: 'Beban Operasional Usaha', Nilai: bebanOperasional },
      { Indikator: 'Total Seluruh Pengeluaran Kas', Nilai: totalPengeluaran },
      { Indikator: 'Laba Bersih', Nilai: labaBersih },
      { Indikator: 'Total Modal Awal Laci Kasir', Nilai: totalModalAwal },
      { Indikator: 'Total Penjualan Tunai Laci', Nilai: totalShiftCash },
      { Indikator: 'Total Uang Seharusnya di Laci', Nilai: totalShiftExpected },
      { Indikator: 'Total Selisih Kasir (+/-)', Nilai: totalDiscrepancy },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Laba Rugi');

    // Sheet 2: Belanja Bahan Baku (HPP)
    const bahanData = expenses
      .filter((e) => e.category === 'Bahan Baku')
      .map((e) => ({
        Tanggal: e.expense_date,
        Keterangan: e.description,
        Nominal: Number(e.amount),
      }));
    const wsBahan = XLSX.utils.json_to_sheet(bahanData);
    XLSX.utils.book_append_sheet(wb, wsBahan, 'HPP Bahan Baku');

    // Sheet 3: Beban Operasional
    const operasionalData = expenses
      .filter((e) => e.category !== 'Bahan Baku')
      .map((e) => ({
        Tanggal: e.expense_date,
        Kategori: e.category,
        Keterangan: e.description,
        Nominal: Number(e.amount),
      }));
    const wsOps = XLSX.utils.json_to_sheet(operasionalData);
    XLSX.utils.book_append_sheet(wb, wsOps, 'Beban Operasional');

    // Sheet 4: Riwayat Transaksi
    const transactionsData = transactions.map((t) => ({
      ID_Transaksi: t.id,
      Tanggal: new Date(t.created_at).toLocaleString('id-ID'),
      Tipe_Order: t.order_type,
      Metode_Bayar: t.payment_method,
      Total_Belanja: Number(t.total_amount),
    }));
    const wsTx = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Penjualan');

    // Sheet 5: Rekap Shift & Laci Kasir
    const shiftDataSheet = shifts.map((s) => ({
      ID_Shift: s.id.slice(0, 8),
      Kasir: s.profiles?.name || 'Kasir',
      Waktu_Buka: new Date(s.opened_at).toLocaleString('id-ID'),
      Waktu_Tutup: s.closed_at ? new Date(s.closed_at).toLocaleString('id-ID') : 'Sedang Aktif',
      Modal_Awal_Laci: Number(s.starting_cash || 0),
      Penjualan_Tunai: Number(s.cash_sales || 0),
      Seharusnya_di_Laci: Number(s.expected_cash || 0),
      Fisik_Aktual_Kasir: Number(s.actual_cash || 0),
      Selisih_Uang: Number(s.discrepancy || 0),
      Status: s.status,
      Catatan: s.notes || '',
    }));
    const wsShifts = XLSX.utils.json_to_sheet(shiftDataSheet);
    XLSX.utils.book_append_sheet(wb, wsShifts, 'Rekap Shift & Laci');

    XLSX.writeFile(wb, `Laporan_Keuangan_${startDate}_sd_${endDate}.xlsx`);
  };

  // Export ke PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const settings = getStoreSettings();

    // Kop Dokumen Toko
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.storeName || 'LAPORAN KEUANGAN UMKM', 105, 16, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.address || '', 105, 22, { align: 'center' });
    doc.text(`Periode: ${startDate} s/d ${endDate}`, 105, 27, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(14, 31, 196, 31);

    // Judul
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN LABA RUGI (METODE PERIODIK)', 14, 40);

    let y = 48;
    const drawRow = (label, value, isBold = false, isHeader = false) => {
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(9);
      if (isHeader) {
        doc.setFillColor(245, 245, 245);
        doc.rect(14, y - 4.5, 182, 6.5, 'F');
      }
      doc.text(label, 16, y);
      doc.text(value, 194, y, { align: 'right' });
      y += 7.5;
    };

    drawRow('1. PENDAPATAN (OMZET)', formatRupiah(totalOmzet), true, true);
    drawRow('   Total Transaksi Penjualan', `${transactions.length} Transaksi`);
    drawRow('   Total Porsi Terjual', `${totalPortionsSold} Porsi`);

    drawRow('2. HARGA POKOK PENJUALAN (HPP)', `(${formatRupiah(hppBahanBaku)})`, true, true);
    drawRow('   Total Belanja Bahan Baku Riil', formatRupiah(hppBahanBaku));
    drawRow('   Food Cost Ratio (%)', `${foodCostPercent}%`);
    drawRow('   Rata-rata HPP per Porsi', formatRupiah(hppPerPorsi));

    drawRow('3. LABA KOTOR', formatRupiah(labaKotor), true, true);

    drawRow('4. BEBAN OPERASIONAL USAHA', `(${formatRupiah(bebanOperasional)})`, true, true);
    const opsByCategory = {};
    expenses
      .filter((e) => e.category !== 'Bahan Baku')
      .forEach((e) => {
        opsByCategory[e.category] = (opsByCategory[e.category] || 0) + Number(e.amount || 0);
      });
    Object.entries(opsByCategory).forEach(([cat, val]) => {
      drawRow(`   - ${cat}`, formatRupiah(val));
    });

    y += 2;
    doc.setLineWidth(0.4);
    doc.line(14, y - 4, 196, y - 4);

    drawRow('5. LABA BERSIH USAHA', formatRupiah(labaBersih), true, true);

    // Footer & Tanda Tangan
    y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, y);
    doc.text('Pemilik / Manajemen UMKM,', 140, y);
    y += 20;
    doc.text('( .................................................. )', 140, y);

    doc.save(`Laporan_Keuangan_${startDate}_sd_${endDate}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Filter Rentang Tanggal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Laporan Keuangan & Laba Rugi</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            HPP dihitung otomatis dari total belanja bahan baku riil periode ini
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2 rounded-xl font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white px-4 py-2 rounded-xl font-bold transition shadow-xs"
          >
            <FileDown className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Laba Rugi Card (5 Kartu) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Omzet */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">TOTAL OMZET</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-black text-slate-900 tabular-nums">{formatRupiah(totalOmzet)}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
              {transactions.length} transaksi kasir
            </p>
          </div>
        </div>

        {/* HPP Riil (Bahan Baku) */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">HPP (BAHAN BAKU)</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-black text-amber-600 tabular-nums">{formatRupiah(hppBahanBaku)}</p>
            <p className="text-[10px] text-amber-800 font-bold mt-1 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md inline-block">
              Food Cost: {foodCostPercent}%
            </p>
          </div>
        </div>

        {/* HPP Rata-rata per Porsi */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">HPP / PORSI RIIL</p>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-black text-indigo-600 tabular-nums">{formatRupiah(hppPerPorsi)}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
              {totalPortionsSold} porsi terjual
            </p>
          </div>
        </div>

        {/* Beban Operasional */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">BEBAN OPERASIONAL</p>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-black text-rose-600 tabular-nums">{formatRupiah(bebanOperasional)}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-1 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
              Gaji, listrik, sewa, dll
            </p>
          </div>
        </div>

        {/* Laba Bersih */}
        <div className={`rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between border transition ${
          labaBersih >= 0
            ? 'bg-emerald-50/50 border-emerald-200/80 hover:border-emerald-300'
            : 'bg-rose-50/50 border-rose-200/80 hover:border-rose-300'
        }`}>
          <div className="flex items-center justify-between">
            <p className={`text-[11px] font-extrabold uppercase tracking-wider ${
              labaBersih >= 0 ? 'text-emerald-800' : 'text-rose-800'
            }`}>
              LABA BERSIH
            </p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              labaBersih >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {labaBersih >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-xl font-black tabular-nums ${labaBersih >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatRupiah(labaBersih)}
            </p>
            <p className="text-[10px] text-slate-500 font-bold mt-1">
              Laba Kotor: {formatRupiah(labaKotor)}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Form Input Pengeluaran & Tabel Riwayat */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
        {/* Form Input Pengeluaran */}
        <div className="md:col-span-5 lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>Catat Pengeluaran Baru</span>
          </h3>

          <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={expenseForm.expense_date}
                onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Kategori Biaya</label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-semibold text-slate-800"
              >
                <option value="Bahan Baku" className="font-bold text-emerald-700">
                  🥩 Bahan Baku / Belanja Pasar (Masuk HPP)
                </option>
                <option value="Operasional">📦 Operasional Harian (Beban Usaha)</option>
                <option value="Gaji Karyawan">👥 Gaji Karyawan (Beban Usaha)</option>
                <option value="Listrik & Air">⚡ Listrik & Air (Beban Usaha)</option>
                <option value="Sewa Tempat">🏪 Sewa Tempat (Beban Usaha)</option>
                <option value="Lainnya">📝 Lainnya (Beban Usaha)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                {expenseForm.category === 'Bahan Baku'
                  ? '💡 Kategori ini otomatis dihitung sebagai Modal HPP produk.'
                  : '💡 Kategori ini dihitung sebagai Beban Operasional bulanan.'}
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Keterangan Belanja</label>
              <input
                type="text"
                required
                placeholder={
                  expenseForm.category === 'Bahan Baku'
                    ? 'cth: Daging sapi 5kg, beras 1 karung, minyak'
                    : 'cth: Token listrik kasir & dapur'
                }
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1">Nominal (Rp)</label>
              <input
                type="number"
                min="0"
                required
                placeholder="cth: 150000"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold tabular-nums"
              />
            </div>

            <button
              type="submit"
              disabled={submittingExpense}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl transition flex items-center justify-center space-x-1.5 shadow-xs disabled:opacity-50"
            >
              {submittingExpense ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Pengeluaran</span>
              )}
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Pengeluaran */}
        <div className="md:col-span-7 lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900">Riwayat Pengeluaran Periode Ini</h3>
            <div className="flex space-x-3 text-xs">
              <span className="text-amber-700 font-bold tabular-nums">HPP: {formatRupiah(hppBahanBaku)}</span>
              <span className="text-rose-600 font-bold tabular-nums">Beban Ops: {formatRupiah(bebanOperasional)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 uppercase text-[10px] text-slate-500 border-b border-slate-200/80 font-bold tracking-wider">
                <tr>
                  <th className="px-3.5 py-3">Tanggal</th>
                  <th className="px-3.5 py-3">Tipe Biaya</th>
                  <th className="px-3.5 py-3">Keterangan</th>
                  <th className="px-3.5 py-3">Nominal</th>
                  <th className="px-3.5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-3.5 py-8 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                      <span>Memuat data pengeluaran...</span>
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-3.5 py-8 text-center text-slate-400">
                      Tidak ada catatan pengeluaran pada rentang tanggal ini.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => {
                    const isHpp = exp.category === 'Bahan Baku';
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2.5 whitespace-nowrap tabular-nums text-slate-500 font-medium">{exp.expense_date}</td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isHpp
                                ? 'bg-amber-100 text-amber-800 border border-amber-200/60'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isHpp ? 'HPP (Bahan Baku)' : exp.category}
                          </span>
                        </td>
                        <td className="px-3.5 py-2.5 font-semibold text-slate-800">{exp.description}</td>
                        <td
                          className={`px-3.5 py-2.5 font-black whitespace-nowrap tabular-nums ${
                            isHpp ? 'text-amber-700' : 'text-rose-600'
                          }`}
                        >
                          {formatRupiah(exp.amount)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bagian Laporan Laci Kasir & Rekonsiliasi Shift */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Rekap Modal Laci & Shift Kasir Periode Ini</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Pencatatan modal kas awal, penerimaan uang tunai laci, dan audit selisih kasir
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-bold text-slate-700">
              Total Shift: {shifts.length}
            </span>
          </div>
        </div>

        {/* 4 Cards Ringkasan Laci */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Modal Awal</p>
            <p className="text-base font-black text-slate-900 mt-0.5 tabular-nums">{formatRupiah(totalModalAwal)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Uang awal diserahkan ke kasir</p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Penjualan Tunai di Laci</p>
            <p className="text-base font-black text-amber-700 mt-0.5 tabular-nums">+{formatRupiah(totalShiftCash)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Akumulasi uang masuk kasir</p>
          </div>

          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Total Seharusnya di Laci</p>
            <p className="text-base font-black text-emerald-900 mt-0.5 tabular-nums">{formatRupiah(totalShiftExpected)}</p>
            <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">Modal Awal + Tunai</p>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Selisih Kasir</p>
            <p
              className={`text-base font-black mt-0.5 tabular-nums ${
                totalDiscrepancy === 0
                  ? 'text-emerald-700'
                  : totalDiscrepancy < 0
                  ? 'text-rose-600'
                  : 'text-blue-700'
              }`}
            >
              {totalDiscrepancy > 0 ? `+${formatRupiah(totalDiscrepancy)}` : formatRupiah(totalDiscrepancy)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {totalDiscrepancy === 0 ? 'Sempurna / Sesuai' : totalDiscrepancy < 0 ? 'Total Uang Kurang' : 'Total Uang Lebih'}
            </p>
          </div>
        </div>

        {/* Tabel Rekap Shift Kasir */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 uppercase text-[10px] text-slate-500 border-b border-slate-200/80 font-bold tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Kasir</th>
                <th className="px-3.5 py-3">Waktu Buka / Tutup</th>
                <th className="px-3.5 py-3 text-right">Modal Awal</th>
                <th className="px-3.5 py-3 text-right">Penjualan Tunai</th>
                <th className="px-3.5 py-3 text-right">Seharusnya</th>
                <th className="px-3.5 py-3 text-right">Fisik Riil</th>
                <th className="px-3.5 py-3 text-center">Selisih</th>
                <th className="px-3.5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-3.5 py-8 text-center text-slate-400">
                    Tidak ada rekaman shift kasir pada rentang periode ini.
                  </td>
                </tr>
              ) : (
                shifts.map((s) => {
                  const opened = new Date(s.opened_at);
                  const closed = s.closed_at ? new Date(s.closed_at) : null;
                  const disc = Number(s.discrepancy || 0);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">{s.profiles?.name || 'Kasir'}</td>
                      <td className="px-3.5 py-2.5 text-[11px] text-slate-500">
                        <div>{opened.toLocaleDateString('id-ID')} ({opened.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})</div>
                        <div className="text-slate-400">
                          {closed ? `Tutup: ${closed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : '— Sedang Aktif —'}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900 tabular-nums">
                        {formatRupiah(s.starting_cash)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-amber-700 tabular-nums">
                        +{formatRupiah(s.cash_sales)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-black text-slate-900 tabular-nums">
                        {formatRupiah(s.expected_cash)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-emerald-800 tabular-nums">
                        {s.actual_cash !== null ? formatRupiah(s.actual_cash) : '—'}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        {s.status === 'open' ? (
                          <span className="text-[11px] text-slate-400">—</span>
                        ) : disc === 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            PAS (Rp 0)
                          </span>
                        ) : disc < 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                            Kurang ({formatRupiah(disc)})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                            Lebih (+{formatRupiah(disc)})
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            s.status === 'open' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.status === 'open' ? 'Buka' : 'Ditutup'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
