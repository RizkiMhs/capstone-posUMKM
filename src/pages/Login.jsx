import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Store,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Zap,
  Wallet,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, profile, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      navigate(profile.role === 'admin' ? '/dashboard' : '/pos', { replace: true });
    }
  }, [user, profile, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userProfile = await login(email, password);
      if (userProfile?.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/pos', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Kolom Kiri: Showcase & Branding (Tampil di Layar Besar >= lg) */}
      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-12 flex-col justify-between border-r border-slate-800/80">
        {/* Ambient Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Store className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-white">
              POS<span className="text-emerald-400">UMKM</span>
            </span>
            <span className="block text-[11px] font-semibold text-emerald-300/80 tracking-wider uppercase">
              Sistem Kasir & Manajemen Kuliner
            </span>
          </div>
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-lg">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Versi 2.0 • Dilengkapi Manajemen Laci Kasir</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Kelola Transaksi & Keuangan Lebih Cepat, Akurat, dan Modern.
            </h1>
            <p className="text-sm text-slate-300/90 leading-relaxed font-normal">
              Platform Point of Sale all-in-one untuk UMKM kuliner dengan integrasi stok real-time, pencatatan modal awal laci, struk thermal Z-Report, dan rekonsiliasi kasir otomatis.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-emerald-500/40 transition">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Transaksi POS Kilat</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Dukungan Dine In, Takeaway, input nomor meja, kalkulator kembalian instan, dan diskon.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-emerald-500/40 transition">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Modal Awal Laci & Z-Report</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Catat pecahan uang kembalian sebelum buka shift dan audit selisih kas fisik saat tutup kasir.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-emerald-500/40 transition">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Laporan Keuangan & HPP</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Analisis laba kotor, beban operasional, food cost %, serta ekspor Excel & PDF satu klik.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Enkripsi Aman & Otentikasi Supabase</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">POS-UMKM v2.0</span>
        </div>
      </div>

      {/* Kolom Kanan: Card Form Login */}
      <div className="w-full lg:w-[46%] flex items-center justify-center p-4 sm:p-8 lg:p-12 relative bg-slate-50 text-slate-900 overflow-y-auto">
        {/* Subtle Ambient BG for Mobile */}
        <div className="lg:hidden absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-slate-900 to-slate-50 pointer-events-none" />

        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-9 shadow-xl shadow-slate-200/70 border border-slate-200/90 relative z-10 transition-all">
          {/* Mobile Brand Logo */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900 tracking-tight">
                POS<span className="text-emerald-600">UMKM</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Sistem Kasir Kuliner</span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Selamat Datang 👋</h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium leading-relaxed">
              Masuk ke akun Anda untuk membuka sesi transaksi kasir atau dashboard analitik.
            </p>
          </div>

          {/* Alert Error */}
          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-rose-50 text-rose-700 text-xs rounded-2xl border border-rose-200 flex items-start space-x-2.5 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="user_email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 hover:bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  placeholder="Masukkan email akun..."
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="user_password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  placeholder="Masukkan kata sandi..."
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none p-0.5 transition"
                  title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-extrabold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-md shadow-emerald-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Masuk...</span>
                </>
              ) : (
                <span>Masuk Sekarang</span>
              )}
            </button>
          </form>

          {/* Footer Card */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium">
              © {new Date().getFullYear()} POS UMKM Kuliner • All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
