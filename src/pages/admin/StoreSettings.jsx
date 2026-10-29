import { useState } from 'react';
import { getStoreSettings, saveStoreSettings } from '../../utils/storeSettings';
import { Store, Save, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';

export default function StoreSettings() {
  const [settings, setSettings] = useState(getStoreSettings());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    setSavedSuccess(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = saveStoreSettings(settings);
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } else {
      alert('Gagal menyimpan pengaturan toko.');
    }
  };

  const handleReset = () => {
    if (!confirm('Kembalikan ke pengaturan awal default?')) return;
    const defaultVals = {
      storeName: 'POS UMKM KULINER',
      address: 'Jl. Kuliner Enak No. 12, Kota',
      phone: '0812-3456-7890',
      receiptFooter: 'Terima Kasih atas Kunjungan Anda\nSelamat Menikmati!',
    };
    saveStoreSettings(defaultVals);
    setSettings(defaultVals);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Pengaturan Identitas Toko</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              Kop & Footer Struk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Informasi toko akan tampil di bagian atas dan bawah struk pembayaran fisik kasir
          </p>
        </div>
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-2xs">
          <Store className="w-6 h-6" />
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2.5 text-emerald-900 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Pengaturan identitas toko berhasil disimpan! Struk kasir akan menggunakan data terbaru.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Form Pengaturan */}
        <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Toko / Resto:
              </label>
              <input
                type="text"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
                required
                placeholder="Contoh: WARUNG MAKAN SEDAP RASA"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Toko Lengkap:
              </label>
              <input
                type="text"
                name="address"
                value={settings.address}
                onChange={handleChange}
                required
                placeholder="Contoh: Jl. Diponegoro No. 45, Kota Baru"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nomor Telepon / WhatsApp:
              </label>
              <input
                type="text"
                name="phone"
                value={settings.phone}
                onChange={handleChange}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Pesan / Ucapan Bawah Struk (Footer):
              </label>
              <textarea
                name="receiptFooter"
                rows="3"
                value={settings.receiptFooter}
                onChange={handleChange}
                placeholder="Contoh: Terima Kasih atas Kunjungan Anda! Selamat Menikmati!"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              />
            </div>

            <div className="pt-2 flex items-center space-x-2.5">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition shadow-sm shadow-emerald-600/25"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition"
                title="Reset Default"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Struk 58mm */}
        <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center">
          <div className="flex items-center space-x-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Live Preview Struk (58mm)</span>
          </div>

          <div className="w-[58mm] bg-amber-50/30 p-3.5 font-mono text-[10px] text-slate-800 border border-dashed border-slate-300 rounded-xl shadow-inner">
            {/* Header Toko */}
            <div className="text-center pb-2.5 border-b border-dashed border-slate-400 space-y-0.5">
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                {settings.storeName || 'NAMA TOKO KULINER'}
              </h2>
              <p className="text-[9px] text-slate-500 leading-tight">{settings.address || 'Alamat Toko'}</p>
              <p className="text-[9px] text-slate-500">Telp: {settings.phone || '-'}</p>
            </div>

            {/* Dummy Content */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-slate-400 text-[9px]">
              <div className="flex justify-between">
                <span>No: #TRX001</span>
                <span>21/10/26 12:00</span>
              </div>
              <div className="flex justify-between">
                <span>1x Nasi Ayam Geprek</span>
                <span>Rp25.000</span>
              </div>
              <div className="flex justify-between font-bold text-slate-700 pt-1">
                <span>TOTAL</span>
                <span>Rp25.000</span>
              </div>
            </div>

            {/* Footer Toko */}
            <div className="text-center pt-2.5 text-[9px] text-slate-600 whitespace-pre-line leading-relaxed font-semibold">
              {settings.receiptFooter || 'Terima Kasih atas Kunjungan Anda!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
