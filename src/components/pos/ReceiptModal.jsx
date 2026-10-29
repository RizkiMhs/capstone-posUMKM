import { Printer, X } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getStoreSettings } from '../../utils/storeSettings';

export default function ReceiptModal({ isOpen, onClose, transactionData }) {
  if (!isOpen || !transactionData) return null;

  const settings = getStoreSettings();

  const {
    id,
    created_at = new Date().toISOString(),
    cashierName = 'Kasir',
    orderType = 'dine_in',
    tableNumber = '',
    paymentMethod = 'tunai',
    items = [],
    subtotal = 0,
    discount = 0,
    totalAmount = 0,
    cashReceived = 0,
    change = 0,
  } = transactionData;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(created_at).toLocaleString('id-ID', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      {/* CSS @media print khusus thermal printer 58mm */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #thermal-receipt, #thermal-receipt * {
            visibility: visible !important;
          }
          #thermal-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            padding: 2mm !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
            font-family: monospace !important;
            font-size: 11px !important;
            line-height: 1.25 !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: 58mm auto;
            margin: 0;
          }
        }
      `}</style>

      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-200/80">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between no-print bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 className="font-extrabold text-slate-900 text-sm">Pratinjau Struk Pembayaran</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content / Kertas Struk 58mm */}
        <div className="overflow-y-auto p-4 flex justify-center bg-slate-100/70">
          <div
            id="thermal-receipt"
            className="w-[58mm] bg-white p-3.5 font-mono text-[11px] text-slate-800 shadow-sm border border-slate-200/80 rounded-xl"
          >
            {/* Header Toko Dinamis */}
            <div className="text-center pb-2.5 border-b border-dashed border-slate-400 space-y-0.5">
              <h2 className="font-extrabold text-sm tracking-wider uppercase text-slate-900">
                {settings.storeName}
              </h2>
              <p className="text-[10px] text-slate-500 leading-tight">{settings.address}</p>
              <p className="text-[10px] text-slate-500">Telp: {settings.phone}</p>
            </div>

            {/* Info Transaksi & Nomor Meja */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>No: #{String(id || '').slice(0, 8)}</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir: {cashierName}</span>
                <span className="uppercase font-bold text-slate-900">
                  {orderType.startsWith('dine_in') ? 'Dine In' : 'Takeaway'}
                </span>
              </div>
              {tableNumber && (
                <div className="flex justify-between font-black text-[11px] text-emerald-800 pt-0.5">
                  <span>MEJA:</span>
                  <span>{tableNumber}</span>
                </div>
              )}
            </div>

            {/* Daftar Menu */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1.5">
              {items.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between">
                    <span className="font-bold truncate pr-1 text-slate-900">{item.name}</span>
                    <span className="flex-shrink-0 tabular-nums">
                      {formatRupiah(item.price_at_transaction * item.qty)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span className="tabular-nums">
                      {item.qty} x {formatRupiah(item.price_at_transaction)}
                    </span>
                    {item.notes && <span className="italic truncate pl-1">({item.notes})</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Rincian Pembayaran & Diskon */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              {discount > 0 && (
                <>
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span className="tabular-nums">{formatRupiah(subtotal || totalAmount + discount)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Diskon:</span>
                    <span className="tabular-nums">-{formatRupiah(discount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between font-black text-[11px] pt-1 text-slate-900 border-t border-dashed border-slate-300">
                <span>TOTAL AKHIR</span>
                <span className="tabular-nums">{formatRupiah(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="uppercase font-bold">{paymentMethod}</span>
              </div>
              {paymentMethod === 'tunai' && (
                <>
                  <div className="flex justify-between">
                    <span>Tunai:</span>
                    <span className="tabular-nums">{formatRupiah(cashReceived)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Kembali:</span>
                    <span className="tabular-nums">{formatRupiah(change)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer Dinamis */}
            <div className="text-center pt-2.5 text-[10px] text-slate-500 whitespace-pre-line leading-relaxed font-medium">
              {settings.receiptFooter}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-100 flex space-x-2.5 no-print bg-white">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm shadow-emerald-600/25 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk (58mm)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
