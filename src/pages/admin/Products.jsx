import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { formatRupiah } from '../../utils/formatRupiah';
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  Loader2,
  Eye,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    name: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    stock: '',
    is_available: true,
    image_url: '',
  };
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)').order('name'),
        supabase.from('categories').select('*').order('name'),
      ]);
      if (prodRes.error) throw prodRes.error;
      if (catRes.error) throw catRes.error;
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      alert('Gagal mengambil data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormData(initialForm);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category_id: item.category_id || '',
      cost_price: item.cost_price,
      selling_price: item.selling_price,
      stock: item.stock,
      is_available: item.is_available,
      image_url: item.image_url || '',
    });
    setImageFile(null);
    setModalOpen(true);
  };

  const uploadImage = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('menus').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('menus').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalImageUrl = formData.image_url;
      if (imageFile) {
        finalImageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name: formData.name,
        category_id: formData.category_id || null,
        cost_price: Number(formData.cost_price || 0),
        selling_price: Number(formData.selling_price || 0),
        stock: Number(formData.stock || 0),
        is_available: formData.is_available,
        image_url: finalImageUrl,
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Gagal menyimpan menu: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus menu ini?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert('Gagal menghapus menu: ' + err.message);
    }
  };

  const calculatedMargin =
    formData.selling_price && formData.cost_price
      ? Number(formData.selling_price) - Number(formData.cost_price)
      : 0;
  const calculatedMarginPercent =
    formData.selling_price && Number(formData.selling_price) > 0
      ? ((calculatedMargin / Number(formData.selling_price)) * 100).toFixed(0)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Manajemen Menu Kuliner</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Kelola katalog makanan & minuman, stok sisa, harga jual, dan estimasi modal
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm shadow-emerald-600/25"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel Menu */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 uppercase border-b border-slate-200/80 font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Menu</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5">HPP (Modal)</th>
                <th className="px-4 py-3.5">Harga Jual</th>
                <th className="px-4 py-3.5">Sisa Stok</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Memuat data menu...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-16 text-center text-slate-400">
                    Belum ada menu yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => {
                  const isOutOfStock = item.stock !== null && item.stock <= 0;
                  const isLowStock = item.stock !== null && item.stock > 0 && item.stock <= 5;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200/60">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400 opacity-60" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
                          <span className="text-[10px] text-slate-400">ID: #{item.id.slice(0, 6)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-semibold text-[11px] text-slate-700">
                          {item.categories?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-amber-700 font-bold tabular-nums">
                        {formatRupiah(item.cost_price)}
                      </td>
                      <td className="px-4 py-3 text-emerald-700 font-black tabular-nums text-sm">
                        {formatRupiah(item.selling_price)}
                      </td>
                      <td className="px-4 py-3">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-black text-[10px]">
                            HABIS (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Sisa {item.stock}
                          </span>
                        ) : (
                          <span className="font-bold tabular-nums text-slate-800">{item.stock} Porsi</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide uppercase ${
                            item.is_available
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          }`}
                        >
                          {item.is_available ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <button
                          onClick={() => setDetailItem(item)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Lihat Detail & Margin"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Edit Menu"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Menu"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Modal Tambah / Edit Menu */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200/80 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900 tracking-tight">
                {editingId ? 'Edit Menu Makanan' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Menu
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Ayam Geprek Sambal Bawang"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori Menu
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Estimasi HPP (Modal)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="Contoh: 12000"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Harga Jual Kasir
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="Contoh: 20000"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold tabular-nums text-emerald-700"
                  />
                </div>
              </div>

              {/* Live Margin Calculation Indicator */}
              {Number(formData.selling_price) > 0 && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center justify-between text-emerald-900">
                  <span className="font-semibold text-xs">Margin Untung / Porsi:</span>
                  <span className="font-extrabold text-sm tabular-nums text-emerald-700">
                    {formatRupiah(calculatedMargin)} ({calculatedMarginPercent}%)
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stok Sedia (Porsi)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="50"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold tabular-nums"
                  />
                </div>
                <div className="pt-5">
                  <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-800">Tersedia Dijual</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Foto Produk Menu
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0] || null)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-xs disabled:opacity-50 transition"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Menyimpan...' : 'Simpan Menu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Menu & Margin */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200/80">
            <div className="relative h-52 bg-slate-100 flex items-center justify-center">
              {detailItem.image_url ? (
                <img
                  src={detailItem.image_url}
                  alt={detailItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-14 h-14 text-slate-300" />
              )}
              <button
                onClick={() => setDetailItem(null)}
                className="absolute top-3.5 right-3.5 bg-white/90 hover:bg-white p-1.5 rounded-full text-slate-700 shadow-md transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3">
                <span
                  className={`text-[11px] px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-sm ${
                    detailItem.is_available ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {detailItem.is_available ? 'Tersedia' : 'Habis'}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-700 uppercase bg-emerald-50 px-2.5 py-1 rounded-md">
                  {detailItem.categories?.name || 'Tanpa Kategori'}
                </span>
                <h3 className="font-black text-xl text-slate-900 mt-2">{detailItem.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">HPP (Modal Porsi)</span>
                  <span className="text-amber-700 font-extrabold text-sm tabular-nums">
                    {formatRupiah(detailItem.cost_price)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Harga Jual Kasir</span>
                  <span className="text-emerald-700 font-extrabold text-sm tabular-nums">
                    {formatRupiah(detailItem.selling_price)}
                  </span>
                </div>
                <div className="pt-2.5 border-t border-slate-200 col-span-2 flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Margin Keuntungan:</span>
                  <span className="text-blue-600 font-black text-sm tabular-nums">
                    {formatRupiah(detailItem.selling_price - detailItem.cost_price)}{' '}
                    <span className="text-xs">
                      ({(((detailItem.selling_price - detailItem.cost_price) / (detailItem.selling_price || 1)) * 100).toFixed(0)}%)
                    </span>
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 col-span-2 flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Sisa Stok Menu:</span>
                  <span className="text-slate-900 font-black tabular-nums">{detailItem.stock} Porsi</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const itemToEdit = detailItem;
                    setDetailItem(null);
                    openEditModal(itemToEdit);
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Menu Ini</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
