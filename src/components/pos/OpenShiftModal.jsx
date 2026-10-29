import { useState } from 'react';
import { useShift } from '../../context/ShiftContext';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../utils/formatRupiah';
import { Wallet, Loader2, Info, Banknote, ShieldAlert } from 'lucide-react';

export default function OpenShiftModal({ isOpen, onClose }) {
  const { profile } = useAuth();
  const { openNewShift } = useShift();
  const [startingCash, setStartingCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const presets = [100000, 200000, 300000, 500000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const nominal = Number(startingCash);
    if (isNaN(nominal) || nominal < 0) {
      setErrorMsg('Nominal modal awal tidak valid');
      return;
    }

    setLoading(true);
    const result = await openNewShift(nominal, notes);
    setLoading(false);

    if (!result.success) {
      setErrorMsg('Gagal membuka shift: ' + result.error);
    } else {
      if (onClose) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-scaleUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Wallet className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight">Buka Kasir & Laci Baru</h3>
              <p className="text-xs text-emerald-100/90 font-medium">
                Kasir: <span className="font-bold text-white">{profile?.name || 'Kasir'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start space-x-3">
            <Info className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <span className="font-bold">Uang Modal Awal:</span> Uang pecahan kembalian yang dimasukkan ke laci sebelum transaksi pertama hari ini dimulai.
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Nominal Modal Awal di Laci (Rp):</span>
              <span className="text-emerald-700 font-extrabold tabular-nums">
                {formatRupiah(Number(startingCash) || 0)}
              </span>
            </label>
            <div className="relative">
              <Banknote className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={startingCash}
                onChange={(e) => setStartingCash(e.target.value)}
                placeholder="Contoh: 200000"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {presets.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setStartingCash(amt.toString())}
                className={`py-1.5 text-xs font-bold rounded-xl border transition-all active:scale-95 ${
                  startingCash === amt.toString()
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {amt / 1000}rb
              </button>
            ))}
          </div>

          {/* Catatan / Keterangan */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Catatan Pembukaan (Opsional):</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cth: Pecahan 50rb (2 lbr), 20rb (5 lbr)..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center space-x-2.5">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Membuka Laci Kasir...</span>
                </>
              ) : (
                <span>Mulai Shift & Buka Laci</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

