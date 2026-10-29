import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatRupiah } from '../../utils/formatRupiah';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
  QrCode,
  Banknote,
  Loader2,
  Search,
  X,
  Utensils,
  Receipt,
  Tag,
  Wallet,
} from 'lucide-react';
import ReceiptModal from '../../components/pos/ReceiptModal';
import { useShift } from '../../context/ShiftContext';
import OpenShiftModal from '../../components/pos/OpenShiftModal';
import CloseShiftModal from '../../components/pos/CloseShiftModal';
import ShiftReceiptModal from '../../components/pos/ShiftReceiptModal';

export default function POS() {
  const { user, profile } = useAuth();
  const { items, addItem, updateQty, updateNotes, removeItem, clearCart, totalAmount } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [search, setSearch] = useState('');
  const [orderType, setOrderType] = useState('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [discount, setDiscount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [cashReceived, setCashReceived] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastChange, setLastChange] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const {
    activeShift,
    loadingShift,
    refreshActiveShift,
    showOpenShiftModal,
    setShowOpenShiftModal,
    showCloseShiftModal,
    setShowCloseShiftModal,
  } = useShift();
  const [showShiftReceipt, setShowShiftReceipt] = useState(false);
  const [shiftReceiptData, setShiftReceiptData] = useState(null);

  const fetchCatalog = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
      ]);
      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error('Gagal mengambil data:', err);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch && p.is_available;
  });

  const numDiscount = Math.max(0, Number(discount) || 0);
  const finalTotal = Math.max(0, totalAmount - numDiscount);
  const numCashReceived = Number(cashReceived) || 0;
  const change = paymentMethod === 'tunai' ? numCashReceived - finalTotal : 0;
  const isPayDisabled =
    processing ||
    items.length === 0 ||
    (paymentMethod === 'tunai' && numCashReceived < finalTotal);

  const totalCartQty = items.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = async () => {
    if (isPayDisabled) return;
    setProcessing(true);
    try {
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert([
          {
            cashier_id: user?.id || null,
            shift_id: activeShift?.id || null,
            total_amount: finalTotal,
            payment_method: paymentMethod,
            order_type:
              orderType === 'dine_in' && tableNumber.trim()
                ? `dine_in - Meja ${tableNumber.trim()}`
                : orderType,
          },
        ])
        .select()
        .single();

      if (txError) throw txError;

      const itemRows = items.map((item) => ({
        transaction_id: transaction.id,
        product_id: item.product_id,
        qty: item.qty,
        price_at_transaction: item.price_at_transaction,
        cost_at_transaction: item.cost_at_transaction,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase.from('transaction_items').insert(itemRows);
      if (itemsError) throw itemsError;

      for (const item of items) {
        const prod = products.find((p) => p.id === item.product_id);
        if (prod && typeof prod.stock === 'number') {
          const newStock = Math.max(0, prod.stock - item.qty);
          await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id);
        }
      }

      const currentChange = paymentMethod === 'tunai' ? change : 0;
      setLastChange(currentChange);
      setReceiptData({
        id: transaction.id,
        created_at: transaction.created_at,
        cashierName: profile?.name || 'Kasir',
        orderType,
        tableNumber: orderType === 'dine_in' ? tableNumber.trim() : '',
        paymentMethod,
        items: [...items],
        subtotal: totalAmount,
        discount: numDiscount,
        totalAmount: finalTotal,
        cashReceived: paymentMethod === 'tunai' ? numCashReceived : finalTotal,
        change: currentChange,
      });

      if (activeShift && paymentMethod === 'tunai') {
        const newCashSales = Number(activeShift.cash_sales || 0) + finalTotal;
        const newExpected = Number(activeShift.starting_cash || 0) + newCashSales;
        await supabase
          .from('cashier_shifts')
          .update({ cash_sales: newCashSales, expected_cash: newExpected })
          .eq('id', activeShift.id);
        refreshActiveShift();
      }

      setShowReceipt(true);
      clearCart();
      setCashReceived('');
      setDiscount('');
      setTableNumber('');
      fetchCatalog();
    } catch (err) {
      alert('Gagal memproses transaksi: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 md:py-6 grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-start">
      {/* Kolom Kiri: Katalog Produk */}
      <div className="md:col-span-7 lg:col-span-8 space-y-4">
        {/* Banner Status Laci Kasir (Modal Awal & Shift) */}
        {!loadingShift && !activeShift ? (
          <div className="p-3.5 bg-amber-50 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Wallet className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="font-bold text-xs text-amber-900">Laci Kasir Belum Dibuka</p>
                <p className="text-[11px] text-amber-700 font-medium">
                  Harap masukkan uang modal awal kembalian untuk membuka shift transaksi hari ini.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowOpenShiftModal(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex-shrink-0"
            >
              Buka Kasir & Modal Awal
            </button>
          </div>
        ) : activeShift ? (
          <div className="px-4 py-2.5 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs text-emerald-900">
                <span className="font-extrabold text-emerald-800">Shift Aktif</span> • Modal Awal Laci:{' '}
                <span className="font-black tabular-nums text-emerald-950">
                  {formatRupiah(activeShift.starting_cash)}
                </span>
                <span className="text-emerald-700 font-medium ml-2 hidden sm:inline">
                  (Dibuka: {new Date(activeShift.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCloseShiftModal(true)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/60 transition shadow-2xs"
            >
              Tutup Kasir (Rekonsiliasi)
            </button>
          </div>
        ) : null}
        {/* Banner Notifikasi Kembalian Transaksi Terakhir */}
        {lastChange !== null && (
          <div className="p-4 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex items-center justify-between text-emerald-900 shadow-xs animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">Transaksi Berhasil Disimpan!</p>
                {paymentMethod === 'tunai' && (
                  <p className="text-xs text-emerald-800">
                    Kembalian: <span className="font-extrabold tabular-nums text-emerald-700">{formatRupiah(lastChange)}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setLastChange(null)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Filter & Pencarian */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari makanan, minuman, camilan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-xs placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                selectedCat === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Semua Menu
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95 ${
                  selectedCat === c.id
                    ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Kartu Menu */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <Utensils className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">Menu tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba kata kunci pencarian atau kategori lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock !== null && p.stock <= 0;
              const isLowStock = p.stock !== null && p.stock > 0 && p.stock <= 5;
              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && addItem(p)}
                  className={`group bg-white rounded-2xl p-3 flex flex-col justify-between border transition-all duration-200 select-none ${
                    isOutOfStock
                      ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50'
                      : 'border-slate-200/90 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/10 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <div>
                    <div className="h-28 bg-slate-100 rounded-xl mb-2.5 overflow-hidden flex items-center justify-center text-slate-400 relative">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 opacity-30 text-slate-500" />
                      )}

                      {/* Badges Status Stok */}
                      {isOutOfStock ? (
                        <span className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm tracking-wide">
                          HABIS
                        </span>
                      ) : isLowStock ? (
                        <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm tracking-wide flex items-center space-x-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>Sisa {p.stock}</span>
                        </span>
                      ) : null}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-emerald-700 transition-colors">
                      {p.name}
                    </h4>
                    <p className={`text-[11px] mt-0.5 ${
                      isOutOfStock ? 'text-rose-600 font-semibold' : isLowStock ? 'text-amber-600 font-semibold' : 'text-slate-400'
                    }`}>
                      Stok: {p.stock ?? 'Tersedia'}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="font-extrabold text-sm text-emerald-600 tabular-nums">
                      {formatRupiah(p.selling_price)}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      aria-label={`Tambah ${p.name}`}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                        isOutOfStock
                          ? 'bg-slate-100 text-slate-300'
                          : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-xs active:scale-90'
                      }`}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Kolom Kanan: Keranjang Belanja */}
      <div className="md:col-span-5 lg:col-span-4 bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 flex flex-col md:sticky md:top-4 shadow-sm shadow-slate-200/50 md:max-h-[calc(100vh-2rem)] overflow-y-auto">
        {/* Header Pesanan */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-2 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">Pesanan Aktif</h3>
                {totalCartQty > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs tabular-nums">
                    {totalCartQty}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {items.length === 0 ? 'Keranjang kosong' : `${items.length} jenis menu`}
              </p>
            </div>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-500 hover:text-rose-700 font-semibold hover:bg-rose-50 px-2.5 py-1 rounded-lg transition"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* List Item Keranjang - Area lebih luas & leluasa */}
        <div className="space-y-2.5 min-h-[220px] max-h-[460px] lg:max-h-[520px] overflow-y-auto pr-1.5 my-1">
          {items.length === 0 ? (
            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-slate-400 text-center py-8">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-2.5 text-slate-400">
                <Receipt className="w-6 h-6 stroke-1" />
              </div>
              <p className="font-bold text-sm text-slate-700">Keranjang masih kosong</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                Pilih menu dari katalog di sebelah kiri untuk menambah pesanan
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.product_id}
                className="p-3.5 bg-slate-50/90 hover:bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition-all space-y-2.5"
              >
                {/* Baris Atas: Nama Produk + Subtotal */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm text-slate-900 leading-snug truncate">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-semibold tabular-nums mt-0.5">
                      {formatRupiah(item.price_at_transaction)} {item.qty > 1 && `× ${item.qty}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-extrabold text-sm text-emerald-700 tabular-nums">
                      {formatRupiah(item.price_at_transaction * item.qty)}
                    </span>
                  </div>
                </div>

                {/* Baris Bawah: Catatan Input + Stepper Tambah/Kurang/Hapus */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <input
                    type="text"
                    placeholder="Catatan (cth: tidak pedas)..."
                    value={item.notes}
                    onChange={(e) => updateNotes(item.product_id, e.target.value)}
                    className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 placeholder:text-slate-400 min-w-0"
                  />

                  {/* Stepper Tambah & Kurang */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQty(item.product_id, -1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-90 transition font-bold"
                      aria-label="Kurangi jumlah"
                      title="Kurangi"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="text-xs font-black w-7 text-center tabular-nums text-slate-900">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.product_id, 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white active:scale-90 transition font-bold"
                      aria-label="Tambah jumlah"
                      title="Tambah"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.product_id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-700 active:scale-90 transition ml-0.5"
                      aria-label="Hapus item"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Panel Checkout */}
        <div className="pt-3 border-t border-slate-200/80 space-y-3 mt-2 flex-shrink-0">
          {/* Tipe Pesanan */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setOrderType('dine_in')}
              className={`py-2 px-2 rounded-xl font-bold border transition-all active:scale-95 flex items-center justify-center space-x-1.5 ${
                orderType === 'dine_in'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🍽️</span>
              <span>Dine In (Meja)</span>
            </button>
            <button
              type="button"
              onClick={() => setOrderType('take_away')}
              className={`py-2 px-2 rounded-xl font-bold border transition-all active:scale-95 flex items-center justify-center space-x-1.5 ${
                orderType === 'take_away'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>🥡</span>
              <span>Takeaway (Bungkus)</span>
            </button>
          </div>

          {/* Nomor Meja jika Dine In */}
          {orderType === 'dine_in' && (
            <div className="relative">
              <input
                type="text"
                placeholder="Nomor / Nama Meja (cth: Meja 05)..."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-slate-800 transition"
              />
            </div>
          )}

          {/* Opsi Pembayaran */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPaymentMethod('tunai')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border font-bold transition-all active:scale-95 ${
                paymentMethod === 'tunai'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs shadow-emerald-600/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Banknote className="w-4 h-4" />
              <span>Tunai</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('qris')}
              className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl border font-bold transition-all active:scale-95 ${
                paymentMethod === 'qris'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs shadow-emerald-600/30'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QRIS</span>
            </button>
          </div>

          {/* Diskon Input */}
          <div className="flex items-center justify-between text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-slate-600 font-semibold flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Diskon (Rp):</span>
            </span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-28 text-right px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-900 tabular-nums"
            />
          </div>

          {/* Input Tunai & Presets */}
          {paymentMethod === 'tunai' && (
            <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700">Uang Diterima:</label>
                <button
                  type="button"
                  onClick={() => setCashReceived(finalTotal.toString())}
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  Uang Pas ({formatRupiah(finalTotal)})
                </button>
              </div>

              <input
                type="number"
                min="0"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 tabular-nums"
              />

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-semibold pt-0.5">
                {[50000, 100000, 200000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCashReceived(preset.toString())}
                    className="py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/30 transition tabular-nums"
                  >
                    {formatRupiah(preset)}
                  </button>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
                <span className="text-slate-500 font-medium">Kembalian:</span>
                <span
                  className={`font-black tabular-nums text-sm ${
                    change >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {change >= 0 ? formatRupiah(change) : 'Uang Kurang'}
                </span>
              </div>
            </div>
          )}

          {/* Subtotal & Total Tagihan */}
          <div className="space-y-1 pt-1 border-t border-slate-200/80">
            {numDiscount > 0 && (
              <>
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">{formatRupiah(totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-rose-600 font-semibold">
                  <span>Diskon:</span>
                  <span className="tabular-nums">-{formatRupiah(numDiscount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center text-sm font-extrabold text-slate-900 pt-0.5">
              <span>Total Tagihan:</span>
              <span className="text-lg text-emerald-600 font-black tabular-nums">
                {formatRupiah(finalTotal)}
              </span>
            </div>
          </div>

          {/* Tombol Bayar */}
          <button
            onClick={handleCheckout}
            disabled={isPayDisabled}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-[0.98] text-white font-extrabold rounded-2xl text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-600/25"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Transaksi...</span>
              </>
            ) : (
              <span>
                Bayar Sekarang{' '}
                {paymentMethod === 'tunai' && numCashReceived >= finalTotal
                  ? `(${formatRupiah(finalTotal)})`
                  : ''}
              </span>
            )}
          </button>
        </div>
      </div>

      <ReceiptModal
        isOpen={showReceipt}
        onClose={() => setShowReceipt(false)}
        transactionData={receiptData}
      />

      <OpenShiftModal
        isOpen={showOpenShiftModal}
        onClose={() => setShowOpenShiftModal(false)}
      />

      <CloseShiftModal
        isOpen={showCloseShiftModal}
        onClose={() => setShowCloseShiftModal(false)}
        onClosedSuccess={(closedData) => {
          setShiftReceiptData(closedData);
          setShowShiftReceipt(true);
        }}
      />

      <ShiftReceiptModal
        isOpen={showShiftReceipt}
        onClose={() => setShowShiftReceipt(false)}
        shiftData={shiftReceiptData}
      />
    </div>
  );
}
