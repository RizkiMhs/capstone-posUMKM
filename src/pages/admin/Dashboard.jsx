import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTransactions } from '../../services/transactionService';
import { getExpenses } from '../../services/expenseService';
import { getProducts } from '../../services/productService';
import { formatRupiah } from '../../utils/formatRupiah';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTransactions(), getExpenses(), getProducts()])
      .then(([txs, exps, prods]) => {
        setTransactions(txs || []);
        setExpenses(exps || []);
        setProducts(prods || []);
      })
      .finally(() => setLoading(false));
  }, []);

  // 1. Total Omzet
  const totalOmzet = transactions.reduce((acc, tx) => acc + Number(tx.total_amount || 0), 0);

  // 2. Total Porsi Terjual
  const totalPortions = transactions.reduce((acc, tx) => {
    const txQty = (tx.transaction_items || []).reduce((sub, item) => sub + (item.qty || 1), 0);
    return acc + txQty;
  }, 0);

  // 3. HPP Riil (Pengeluaran Belanja Bahan Baku)
  const hppBahanBaku = expenses
    .filter((e) => e.category === 'Bahan Baku')
    .reduce((acc, exp) => acc + Number(exp.amount || 0), 0);

  // 4. Beban Operasional Usaha (Non-Bahan Baku)
  const bebanOperasional = expenses
    .filter((e) => e.category !== 'Bahan Baku')
    .reduce((acc, exp) => acc + Number(exp.amount || 0), 0);

  // 5. Laba Kotor & Laba Bersih
  const labaKotor = totalOmzet - hppBahanBaku;
  const labaBersih = labaKotor - bebanOperasional;

  // 6. Food Cost % & Rata-rata Modal per Porsi
  const foodCostPercent = totalOmzet > 0 ? ((hppBahanBaku / totalOmzet) * 100).toFixed(1) : 0;
  const hppPerPorsi = totalPortions > 0 ? Math.round(hppBahanBaku / totalPortions) : 0;

  const lowStockProducts = products.filter(
    (p) => typeof p.stock === 'number' && p.stock <= 5
  );

  const chartData = [
    { name: 'Omzet', total: totalOmzet, color: '#0284c7' },
    { name: 'HPP Bahan', total: hppBahanBaku, color: '#d97706' },
    { name: 'Beban Ops', total: bebanOperasional, color: '#e11d48' },
    { name: 'Laba Bersih', total: Math.max(0, labaBersih), color: '#059669' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs font-sans">
          <p className="font-bold text-slate-300">{label}</p>
          <p className="text-emerald-400 font-extrabold text-sm tabular-nums mt-0.5">
            {formatRupiah(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-medium">Memuat data dashboard & keuangan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard & Ringkasan Keuangan</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            HPP dihitung otomatis dari belanja bahan baku riil menggunakan metode periodik
          </p>
        </div>
      </div>

      {/* Peringatan Stok Menipis */}
      {lowStockProducts.length > 0 && (
        <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs animate-fadeIn">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-amber-950">
                Peringatan: {lowStockProducts.length} Menu Memiliki Stok Menipis (≤ 5)
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {lowStockProducts.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900"
                  >
                    {p.name}: <span className="ml-1 text-amber-950 font-black">{p.stock}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <Link
            to="/products"
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold whitespace-nowrap self-start sm:self-auto transition shadow-xs flex items-center space-x-1"
          >
            <span>Kelola Stok</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 5 Kartu Finansial Utama */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Omzet */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Omzet</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-black text-slate-900 tabular-nums">{formatRupiah(totalOmzet)}</p>
            <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
              {transactions.length} transaksi kasir
            </span>
          </div>
        </div>

        {/* HPP Bahan Baku */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">HPP (Bahan Baku)</p>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-black text-amber-600 tabular-nums">{formatRupiah(hppBahanBaku)}</p>
            <span className="inline-block text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md mt-1">
              Food Cost: {foodCostPercent}%
            </span>
          </div>
        </div>

        {/* HPP / Porsi */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">HPP / Porsi Riil</p>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-black text-indigo-600 tabular-nums">{formatRupiah(hppPerPorsi)}</p>
            <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
              {totalPortions} porsi terjual
            </span>
          </div>
        </div>

        {/* Beban Ops */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Beban Operasional</p>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-black text-rose-600 tabular-nums">{formatRupiah(bebanOperasional)}</p>
            <span className="inline-block text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
              Listrik, sewa, gaji dll
            </span>
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
              Laba Bersih
            </p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              labaBersih >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {labaBersih >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3">
            <p className={`text-xl font-black tabular-nums ${
              labaBersih >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}>
              {formatRupiah(labaBersih)}
            </p>
            <span className="inline-block text-[10px] font-bold text-slate-500 mt-1">
              Laba Kotor: {formatRupiah(labaKotor)}
            </span>
          </div>
        </div>
      </div>

      {/* Grafik Laba Rugi */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Perbandingan Performa Laba-Rugi Riil</h3>
              <p className="text-[11px] text-slate-400">Komparasi pendapatan terhadap biaya modal dan beban usaha</p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(val) => `Rp${val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${val / 1000}k`}`}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
