import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../utils/formatRupiah';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { TrendingUp, Flame, Clock, Loader2, BarChart3 } from 'lucide-react';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [peakHours, setPeakHours] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [txRes, itemsRes] = await Promise.all([
          supabase.from('transactions').select('created_at, total_amount'),
          supabase.from('transaction_items').select('qty, products(name)'),
        ]);

        if (txRes.error) throw txRes.error;
        if (itemsRes.error) throw itemsRes.error;

        const transactions = txRes.data || [];
        const items = itemsRes.data || [];

        // 1. Tren Omzet Harian
        const dailyMap = {};
        transactions.forEach((tx) => {
          const dateStr = new Date(tx.created_at).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
          });
          dailyMap[dateStr] = (dailyMap[dateStr] || 0) + Number(tx.total_amount || 0);
        });
        const dailyData = Object.keys(dailyMap).map((date) => ({
          date,
          omzet: dailyMap[date],
        }));
        setDailyRevenue(dailyData);

        // 2. Top 5 Produk Terlaris
        const productMap = {};
        items.forEach((item) => {
          const prodName = item.products?.name || 'Menu Lain';
          productMap[prodName] = (productMap[prodName] || 0) + (item.qty || 1);
        });
        const top5 = Object.keys(productMap)
          .map((name) => ({ name, qty: productMap[name] }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);
        setTopProducts(top5);

        // 3. Jam Sibuk Transaksi (06:00 - 23:00)
        const hourMap = Array.from({ length: 24 }, (_, i) => ({
          hour: `${String(i).padStart(2, '0')}:00`,
          transaksi: 0,
        }));
        transactions.forEach((tx) => {
          const hour = new Date(tx.created_at).getHours();
          if (hourMap[hour]) {
            hourMap[hour].transaksi += 1;
          }
        });
        const activeHours = hourMap.filter((h) => {
          const hNum = parseInt(h.hour);
          return hNum >= 6 && hNum <= 23;
        });
        setPeakHours(activeHours);
      } catch (err) {
        console.error('Gagal memuat analitik:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const CustomTooltipRevenue = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-semibold text-slate-400">{label}</p>
          <p className="text-emerald-400 font-black text-sm tabular-nums mt-0.5">
            {formatRupiah(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipProducts = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-bold text-slate-200">{label}</p>
          <p className="text-amber-400 font-black text-sm tabular-nums mt-0.5">
            {payload[0].value} Porsi Terjual
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipHours = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
          <p className="font-semibold text-slate-400">Pukul {label}</p>
          <p className="text-indigo-400 font-black text-sm tabular-nums mt-0.5">
            {payload[0].value} Transaksi
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-slate-400 text-sm">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
        <p className="font-medium">Memuat data analitik restoran...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Analisis Penjualan & Performa Resto</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              Data Riil
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Visualisasi tren omzet, produk paling laku, dan jam operasional tersibuk
          </p>
        </div>
      </div>

      {/* 1. Line Chart: Tren Omzet Harian */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Tren Omzet Penjualan Harian</h3>
            <p className="text-[11px] text-slate-400 font-medium">Grafik pergerakan omzet per tanggal transaksi</p>
          </div>
        </div>

        <div className="h-72 w-full">
          {dailyRevenue.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
              Belum ada riwayat transaksi yang tercatat
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenue} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(val) => `Rp${val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`}`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltipRevenue />} />
                <Line
                  type="monotone"
                  dataKey="omzet"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid: 2 Bar Chart (5 Produk Terlaris & Jam Sibuk) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* 2. Bar Chart: 5 Produk Terlaris */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Top 5 Menu Paling Laris</h3>
              <p className="text-[11px] text-slate-400 font-medium">Berdasarkan total kuantitas porsi terjual</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                Belum ada data penjualan produk
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} margin={{ top: 10, right: 15, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltipProducts />} />
                  <Bar dataKey="qty" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 3. Bar Chart: Jam Sibuk Transaksi */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Distribusi Jam Sibuk Kasir</h3>
              <p className="text-[11px] text-slate-400 font-medium">Kepadatan pesanan per jam operasional (06:00 - 23:00)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} interval={1} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltipHours />} />
                <Bar dataKey="transaksi" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
