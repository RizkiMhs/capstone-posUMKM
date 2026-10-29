import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../utils/formatRupiah';
import {
  Calendar,
  Search,
  Printer,
  Banknote,
  QrCode,
  DollarSign,
  Receipt,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Wallet,
  Lock,
  ShieldCheck,
  AlertTriangle,
  History,
} from 'lucide-react';
import ReceiptModal from '../../components/pos/ReceiptModal';
import { useShift } from '../../context/ShiftContext';
import { getAllShifts } from '../../services/shiftService';
import OpenShiftModal from '../../components/pos/OpenShiftModal';
import CloseShiftModal from '../../components/pos/CloseShiftModal';
import ShiftReceiptModal from '../../components/pos/ShiftReceiptModal';

export default function OrderHistory() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [transactions, setTransactions] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' | 'shifts'

  const {
    activeShift,
    refreshActiveShift,
    showOpenShiftModal,
    setShowOpenShiftModal,
    showCloseShiftModal,
    setShowCloseShiftModal,
  } = useShift();

  const [activeReceipt, setActiveReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const [selectedShiftForPrint, setSelectedShiftForPrint] = useState(null);
  const [showShiftReceiptModal, setShowShiftReceiptModal] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const startIso = `${selectedDate}T00:00:00.000Z`;
      const endIso = `${selectedDate}T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('transactions')
        .select('*, profiles(name), transaction_items(*, products(name))')
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      alert('Gagal mengambil data transaksi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchShifts = async () => {
    setLoadingShifts(true);
    try {
      const data = await getAllShifts({ startDate: selectedDate, endDate: selectedDate });
      setShifts(data || []);
    } catch (err) {
      console.error('Gagal mengambil data shift:', err);
    } finally {
      setLoadingShifts(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchShifts();
  }, [selectedDate]);

  // Rekap Shift / Tutup Kasir
  const totalOrders = transactions.length;
  const totalOmzet = transactions.reduce((acc, tx) => acc + Number(tx.total_amount || 0), 0);
  const totalTunai = transactions
    .filter((tx) => tx.payment_method === 'tunai')
    .reduce((acc, tx) => acc + Number(tx.total_amount || 0), 0);
  const totalQRIS = transactions
    .filter((tx) => tx.payment_method === 'qris')
    .reduce((acc, tx) => acc + Number(tx.total_amount || 0), 0);

  const activeStartingCash = Number(activeShift?.starting_cash || 0);
  const expectedCashInDrawer = activeStartingCash + totalTunai;

  // Filter List Transaksi
  const filteredTransactions = transactions.filter((tx) => {
    const matchSearch =
      tx.id.toLowerCase().includes(search.toLowerCase()) ||
      (tx.order_type || '').toLowerCase().includes(search.toLowerCase()) ||
      (tx.profiles?.name || '').toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === 'all' || tx.payment_method === methodFilter;
    return matchSearch && matchMethod;
  });

  const handleOpenReceipt = (tx) => {
    const itemsFormatted = (tx.transaction_items || []).map((ti) => ({
      name: ti.products?.name || 'Item Menu',
      qty: ti.qty,
      price_at_transaction: ti.price_at_transaction,
      notes: ti.notes || '',
    }));

    const tableNum = tx.order_type?.includes('Meja ')
      ? tx.order_type.split('Meja ')[1]
      : '';

    setActiveReceipt({
      id: tx.id,
      created_at: tx.created_at,
      cashierName: tx.profiles?.name || 'Kasir',
      orderType: tx.order_type,
      tableNumber: tableNum,
      paymentMethod: tx.payment_method,
      items: itemsFormatted,
      subtotal: tx.total_amount,
      discount: 0,
      totalAmount: tx.total_amount,
      cashReceived: tx.total_amount,
      change: 0,
    });
    setShowReceiptModal(true);
  };

  const handlePrintShiftReceipt = (shift) => {
    setSelectedShiftForPrint(shift);
    setShowShiftReceiptModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Filter Tanggal + Aksi Buka/Tutup Kasir */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Riwayat & Rekap Kasir</h1>
            {activeShift ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Shift Berjalan</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                Laci Belum Dibuka
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Laporan penjualan, pencatatan modal awal laci, rekonsiliasi kas, serta pencetakan Z-Report
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {activeShift ? (
            <button
              onClick={() => setShowCloseShiftModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Tutup Kasir (Rekonsiliasi)</span>
            </button>
          ) : (
            <button
              onClick={() => setShowOpenShiftModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs active:scale-95"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Buka Kasir & Modal Awal</span>
            </button>
          )}

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100/80 transition">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => {
              fetchTransactions();
              fetchShifts();
              refreshActiveShift();
            }}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition active:scale-95 shadow-2xs"
            title="Muat Ulang Data"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Ringkasan Finansial Laci Kasir & Shift */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Modal Awal Laci */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Modal Awal Laci</p>
            <p className="text-xl font-black text-slate-900 mt-1 tabular-nums">
              {formatRupiah(activeStartingCash)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Uang pecahan kembalian</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Penjualan Tunai */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Penjualan Tunai</p>
            <p className="text-xl font-black text-amber-600 mt-1 tabular-nums">{formatRupiah(totalTunai)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Dari transaksi tunai hari ini</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        {/* Uang Fisik Seharusnya di Laci */}
        <div className="bg-white border border-emerald-200/80 bg-emerald-50/20 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between hover:border-emerald-300 transition">
          <div>
            <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Total Fisik di Laci</p>
            <p className="text-xl font-black text-emerald-800 mt-1 tabular-nums">{formatRupiah(expectedCashInDrawer)}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Modal Awal + Penjualan Tunai</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Non-Tunai QRIS & Total Omzet */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between hover:border-slate-300 transition">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Non-Tunai (QRIS)</p>
            <p className="text-xl font-black text-purple-600 mt-1 tabular-nums">{formatRupiah(totalQRIS)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Total Omzet: {formatRupiah(totalOmzet)}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <QrCode className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigasi: Transaksi vs Riwayat Tutup Kasir */}
      <div className="flex border-b border-slate-200 text-xs font-bold space-x-6">
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 transition relative flex items-center space-x-2 ${
            activeTab === 'transactions'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Daftar Transaksi ({transactions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`pb-3 transition relative flex items-center space-x-2 ${
            activeTab === 'shifts'
              ? 'text-emerald-700 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Shift & Rekonsiliasi Laci ({shifts.length})</span>
        </button>
      </div>

      {/* TAB 1: Daftar Transaksi */}
      {activeTab === 'transactions' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No. Struk, Kasir, atau Meja..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center space-x-1.5 self-end sm:self-auto text-xs bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMethodFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 ${
                  methodFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setMethodFilter('tunai')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 ${
                  methodFilter === 'tunai'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tunai
              </button>
              <button
                onClick={() => setMethodFilter('qris')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all active:scale-95 ${
                  methodFilter === 'qris'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                QRIS
              </button>
            </div>
          </div>

          {/* Tabel Transaksi */}
          {loading ? (
            <div className="py-16 flex flex-col justify-center items-center text-slate-400 text-xs space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span>Memuat data transaksi...</span>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <ShoppingBag className="w-6 h-6 stroke-1" />
              </div>
              <p className="font-semibold text-slate-600 text-sm">Tidak ada transaksi ditemukan</p>
              <p className="text-slate-400">Pilih tanggal lain atau periksa kata kunci pencarian</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase border-b border-slate-200/80 font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">No. Struk</th>
                    <th className="py-3.5 px-4">Waktu</th>
                    <th className="py-3.5 px-4">Kasir</th>
                    <th className="py-3.5 px-4">Tipe / Meja</th>
                    <th className="py-3.5 px-4">Metode</th>
                    <th className="py-3.5 px-4 text-right">Total</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          #{tx.id.slice(0, 8)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                        {new Date(tx.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-semibold">
                        {tx.profiles?.name || 'Kasir'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {tx.order_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold uppercase tracking-wide inline-flex items-center space-x-1 ${
                            tx.payment_method === 'tunai'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                              : 'bg-purple-50 text-purple-700 border border-purple-200/60'
                          }`}
                        >
                          {tx.payment_method === 'tunai' ? (
                            <Banknote className="w-3 h-3 mr-1 inline" />
                          ) : (
                            <QrCode className="w-3 h-3 mr-1 inline" />
                          )}
                          <span>{tx.payment_method}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm tabular-nums">
                        {formatRupiah(tx.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenReceipt(tx)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-xl transition-all font-semibold text-xs shadow-2xs active:scale-95"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak Ulang</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Riwayat Shift & Rekonsiliasi Laci */}
      {activeTab === 'shifts' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 animate-fadeIn">
          {loadingShifts ? (
            <div className="py-16 flex flex-col justify-center items-center text-slate-400 text-xs space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span>Memuat data riwayat shift...</span>
            </div>
          ) : shifts.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 text-xs space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                <History className="w-6 h-6 stroke-1" />
              </div>
              <p className="font-semibold text-slate-600 text-sm">Belum ada riwayat shift pada tanggal ini</p>
              <p className="text-slate-400">Pilih tanggal lain untuk melihat shift yang sudah ditutup</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase border-b border-slate-200/80 font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Kasir</th>
                    <th className="py-3.5 px-4">Waktu Buka / Tutup</th>
                    <th className="py-3.5 px-4 text-right">Modal Awal Laci</th>
                    <th className="py-3.5 px-4 text-right">Penjualan Tunai</th>
                    <th className="py-3.5 px-4 text-right">Seharusnya di Laci</th>
                    <th className="py-3.5 px-4 text-right">Fisik Aktual</th>
                    <th className="py-3.5 px-4 text-center">Selisih</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {shifts.map((s) => {
                    const opened = new Date(s.opened_at);
                    const closed = s.closed_at ? new Date(s.closed_at) : null;
                    const disc = Number(s.discrepancy || 0);

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {s.profiles?.name || 'Kasir'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px] space-y-0.5">
                          <div>
                            Buka:{' '}
                            <span className="font-semibold text-slate-800">
                              {opened.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div>
                            Tutup:{' '}
                            <span className="font-semibold text-slate-800">
                              {closed
                                ? closed.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                : '— Sedang Aktif —'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 tabular-nums">
                          {formatRupiah(s.starting_cash)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-amber-700 tabular-nums">
                          +{formatRupiah(s.cash_sales)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 tabular-nums">
                          {formatRupiah(s.expected_cash)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-800 tabular-nums">
                          {s.actual_cash !== null ? formatRupiah(s.actual_cash) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {s.status === 'open' ? (
                            <span className="text-[11px] text-slate-400 font-semibold">—</span>
                          ) : disc === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800">
                              PAS (Rp 0)
                            </span>
                          ) : disc < 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800">
                              Kurang ({formatRupiah(disc)})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800">
                              Lebih (+{formatRupiah(disc)})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              s.status === 'open'
                                ? 'bg-amber-100 text-amber-900 animate-pulse'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {s.status === 'open' ? 'Buka' : 'Ditutup'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {s.status === 'closed' ? (
                            <button
                              onClick={() => handlePrintShiftReceipt(s)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-bold text-[11px] transition shadow-2xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Z-Report</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowCloseShiftModal(true)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition shadow-2xs"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Tutup</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Struk Transaksi */}
      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        transactionData={activeReceipt}
      />

      {/* Modal Buka Kasir */}
      <OpenShiftModal
        isOpen={showOpenShiftModal}
        onClose={() => {
          setShowOpenShiftModal(false);
          fetchShifts();
        }}
      />

      {/* Modal Tutup Kasir */}
      <CloseShiftModal
        isOpen={showCloseShiftModal}
        onClose={() => setShowCloseShiftModal(false)}
        onClosedSuccess={(closedData) => {
          fetchShifts();
          setSelectedShiftForPrint(closedData);
          setShowShiftReceiptModal(true);
        }}
      />

      {/* Modal Cetak Z-Report */}
      <ShiftReceiptModal
        isOpen={showShiftReceiptModal}
        onClose={() => setShowShiftReceiptModal(false)}
        shiftData={selectedShiftForPrint}
      />
    </div>
  );
}
