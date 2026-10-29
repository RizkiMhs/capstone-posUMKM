import { useState, useEffect } from 'react';
import { useShift } from '../../context/ShiftContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../utils/formatRupiah';
import {
  Lock,
  Loader2,
  DollarSign,
  Banknote,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function CloseShiftModal({ isOpen, onClose, onClosedSuccess }) {
  const { profile } = useAuth();
  const { activeShift, closeActiveShift } = useShift();
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [stats, setStats] = useState({
    cashSales: 0,
    qrisSales: 0,
    totalSales: 0,
    orderCount: 0,
  });

  useEffect(() => {
    if (!isOpen || !activeShift) return;

    const fetchShiftStats = async () => {
      setFetchingStats(true);
      try {
        const { data: txs, error } = await supabase
          .from('transactions')
          .select('id, total_amount, payment_method')
          .eq('shift_id', activeShift.id);

        if (error) throw error;

        const list = txs || [];
        const cash = list
          .filter((t) => t.payment_method === 'tunai')
          .reduce((sum, t) => sum + Number(t.total_amount || 0), 0);
        const qris = list
          .filter((t) => t.payment_method === 'qris')
          .reduce((sum, t) => sum + Number(t.total_amount || 0), 0);

        setStats({
          cashSales: cash,
          qrisSales: qris,
          totalSales: cash + qris,
          orderCount: list.length,
        });

        // Set default hitungan fisik sama dengan yang diharapkan agar kasir mudah mencocokkan
        const expected = Number(activeShift.starting_cash || 0) + cash;
        setActualCash(expected.toString());
      } catch (err) {
        console.error('Gagal memuat ringkasan shift:', err);
      } finally {
        setFetchingStats(false);
      }
    };

    fetchShiftStats();
  }, [isOpen, activeShift]);

  if (!isOpen || !activeShift) return null;

  const startingCash = Number(activeShift.starting_cash || 0);
  const expectedCash = startingCash + stats.cashSales;
  const numActualCash = Number(actualCash) || 0;
  const discrepancy = numActualCash - expectedCash;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const result = await closeActiveShift(numActualCash, notes);
    setLoading(false);

    if (!result.success) {
      setErrorMsg('Gagal menutup shift: ' + result.error);
    } else {
      if (onClosedSuccess) {
        onClosedSuccess({
          ...result.data,
          stats,
        });
      }
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scaleUp max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4.5 text-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Tutup Kasir & Rekonsiliasi Laci</h3>
              <p className="text-xs text-slate-400 font-medium">
                Kasir: <span className="text-white font-bold">{profile?.name || activeShift.profiles?.name || 'Kasir'}</span> • Dimulai: {new Date(activeShift.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Breakdown Ringkasan Penjualan */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ringkasan Sistem Shift Ini</p>
            
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span className="flex items-center space-x-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Modal Awal di Laci:</span>
              </span>
              <span className="font-extrabold text-slate-900 tabular-nums">
                {formatRupiah(startingCash)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600">
              <span className="flex items-center space-x-1.5">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>Total Penjualan Tunai:</span>
              </span>
              <span className="font-extrabold text-amber-700 tabular-nums">
                +{formatRupiah(stats.cashSales)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-600">
              <span className="flex items-center space-x-1.5">
                <QrCode className="w-4 h-4 text-purple-600" />
                <span>Total Penjualan QRIS:</span>
              </span>
              <span className="font-extrabold text-purple-700 tabular-nums">
                {formatRupiah(stats.qrisSales)}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700">Total Uang Fisik Seharusnya di Laci:</span>
              <span className="font-black text-emerald-700 text-sm tabular-nums">
                {formatRupiah(expectedCash)}
              </span>
            </div>
          </div>

          {/* Input Uang Fisik Aktual */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Hitung Uang Fisik Riil di Laci (Rp):</span>
              <span className="text-[11px] text-slate-400 font-normal">Hitung lembar & koin fisik</span>
            </label>
            <div className="relative">
              <Banknote className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                min="0"
                step="500"
                required
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="Total uang fisik di laci"
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Status Selisih (Discrepancy) */}
          <div className="p-3.5 rounded-2xl border transition-all text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {discrepancy === 0 ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-900">Uang Laci Sesuai (PAS)</p>
                    <p className="text-[11px] text-emerald-700">Tidak ada selisih uang kasir</p>
                  </div>
                </>
              ) : discrepancy < 0 ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <div>
                    <p className="font-bold text-rose-900">Uang Laci Kurang (Tekor)</p>
                    <p className="text-[11px] text-rose-700">Fisik kurang dari perhitungan sistem</p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-900">Uang Laci Lebih (+)</p>
                    <p className="text-[11px] text-blue-700">Fisik lebih banyak dari perhitungan</p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Selisih Kasir</span>
              <span
                className={`font-black text-sm tabular-nums ${
                  discrepancy === 0
                    ? 'text-emerald-700'
                    : discrepancy < 0
                    ? 'text-rose-600'
                    : 'text-blue-700'
                }`}
              >
                {discrepancy > 0 ? `+${formatRupiah(discrepancy)}` : formatRupiah(discrepancy)}
              </span>
            </div>
          </div>

          {/* Catatan Tutup Kasir */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Catatan Serah Terima / Penjelasan Selisih:</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cth: Uang diserahkan ke Pak Budi (Shift 2) / Kembalian sisa tip..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition"
            >
              Kembali
            </button>
            <button
              type="submit"
              disabled={loading || fetchingStats}
              className="flex-1 py-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 active:scale-[0.98] text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-slate-900/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Rekap Tutup Shift...</span>
                </>
              ) : (
                <span>Konfirmasi Tutup Kasir</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

