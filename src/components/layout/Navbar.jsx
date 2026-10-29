import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useShift } from '../../context/ShiftContext';
import { signOut } from '../../services/authService';
import { formatRupiah } from '../../utils/formatRupiah';
import {
  Store,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  FileText,
  BarChart3,
  Tags,
  Users,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Wallet,
} from 'lucide-react';

export default function Navbar() {
  const { profile } = useAuth();
  const { activeShift, setShowOpenShiftModal, setShowCloseShiftModal } = useShift();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('pos_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    try {
      localStorage.setItem('pos_sidebar_collapsed', String(nextState));
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const userInitial = (profile?.name || 'U').charAt(0).toUpperCase();

  const navItemClass = ({ isActive }) =>
    `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 group relative ${
      isActive
        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:scale-95'
    } ${isCollapsed ? 'justify-center px-0' : ''}`;

  const navItems = [
    {
      to: '/pos',
      label: 'Kasir (POS)',
      icon: ShoppingCart,
      adminOnly: false,
    },
    {
      to: '/history',
      label: 'Riwayat Transaksi',
      icon: History,
      adminOnly: false,
    },
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      adminOnly: true,
    },
    {
      to: '/products',
      label: 'Menu Makanan',
      icon: UtensilsCrossed,
      adminOnly: true,
    },
    {
      to: '/categories',
      label: 'Kategori',
      icon: Tags,
      adminOnly: true,
    },
    {
      to: '/finance',
      label: 'Keuangan & Laba Rugi',
      icon: FileText,
      adminOnly: true,
    },
    {
      to: '/analytics',
      label: 'Analisis Penjualan',
      icon: BarChart3,
      adminOnly: true,
    },
    {
      to: '/settings',
      label: 'Identitas Toko',
      icon: Settings,
      adminOnly: true,
    },
    {
      to: '/users',
      label: 'Kelola Pengguna',
      icon: Users,
      adminOnly: true,
    },
  ];

  const visibleItems = navItems.filter(
    (item) => !item.adminOnly || profile?.role === 'admin'
  );

  return (
    <>
      {/* Top Bar Khusus Mobile (< md) */}
      <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 h-14 flex items-center justify-between shadow-2xs">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm tracking-tight">
              POS<span className="text-emerald-600">UMKM</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-500/20">
            {userInitial}
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex animate-fadeIn">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col justify-between p-5 shadow-2xl z-10 animate-slideRight">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <Link
                  to="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center space-x-2.5"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 text-base leading-none">
                      POS<span className="text-emerald-600">UMKM</span>
                    </span>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Kuliner Terintegrasi</p>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-14rem)] scrollbar-none">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20">
                  {userInitial}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-xs leading-tight">{profile?.name || 'Kasir'}</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded uppercase bg-slate-100 text-slate-600">
                    {profile?.role || 'Staff'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop & Tablet Sidebar Kiri (md:) */}
      <aside
        className={`hidden md:flex flex-col justify-between bg-white border-r border-slate-200/80 sticky top-0 h-screen transition-all duration-300 z-30 select-none shadow-xs ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Header & Logo */}
        <div>
          <div className={`p-4 flex items-center border-b border-slate-100 h-16 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}>
            <Link to="/" className="flex items-center space-x-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30 flex-shrink-0">
                <Store className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col leading-tight whitespace-nowrap overflow-hidden">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight">
                    POS<span className="text-emerald-600 font-black">UMKM</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Kuliner Terpadu
                  </span>
                </div>
              )}
            </Link>

            {!isCollapsed && (
              <button
                onClick={toggleCollapse}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                title="Kecilkan Sidebar (Minimize)"
                aria-label="Kecilkan Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tombol Expand saat Collapsed */}
          {isCollapsed && (
            <div className="flex justify-center py-2 border-b border-slate-100">
              <button
                onClick={toggleCollapse}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                title="Perluas Sidebar (Expand)"
                aria-label="Perluas Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Items List */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-9rem)] scrollbar-none">
            {!isCollapsed && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Menu Utama
              </p>
            )}
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navItemClass}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Profile & Logout Section */}
        <div className={`p-3 border-t border-slate-100 bg-slate-50/50 ${
          isCollapsed ? 'flex flex-col items-center space-y-2' : ''
        }`}>
          {isCollapsed ? (
            <>
              <button
                onClick={() => activeShift ? setShowCloseShiftModal(true) : setShowOpenShiftModal(true)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                  activeShift ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
                title={activeShift ? `Laci Buka: ${formatRupiah(activeShift.starting_cash)} (Klik utk Tutup)` : 'Laci Belum Buka (Klik utk Buka)'}
              >
                <Wallet className="w-4 h-4" />
              </button>
              <div
                className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20"
                title={`${profile?.name || 'Kasir'} (${profile?.role || 'Staff'})`}
              >
                {userInitial}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
                title="Keluar dari Akun"
                aria-label="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {activeShift ? (
                <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span className="font-bold text-emerald-900 truncate">Laci: {formatRupiah(activeShift.starting_cash)}</span>
                  </div>
                  <button
                    onClick={() => setShowCloseShiftModal(true)}
                    className="text-[10px] font-black text-emerald-800 hover:text-emerald-950 underline flex-shrink-0 ml-1"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <div className="mb-2.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="font-bold text-amber-900 truncate">Laci Belum Dibuka</span>
                  </div>
                  <button
                    onClick={() => setShowOpenShiftModal(true)}
                    className="text-[10px] font-black text-amber-800 hover:text-amber-950 underline flex-shrink-0 ml-1"
                  >
                    Buka
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20 flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="overflow-hidden leading-tight">
                    <p className="font-bold text-slate-800 text-xs truncate">{profile?.name || 'Kasir'}</p>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        profile?.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {profile?.role || 'Staff'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition flex-shrink-0"
                  title="Keluar dari Akun"
                  aria-label="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
