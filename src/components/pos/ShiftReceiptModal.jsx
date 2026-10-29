import { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { getStoreSettings } from '../../utils/storeSettings';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function ShiftReceiptModal({ isOpen, onClose, shiftData }) {
  const receiptRef = useRef(null);
  const settings = getStoreSettings();

  if (!isOpen || !shiftData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [58, 160],
      });
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Z-Report-Shift-${shiftData.id.slice(0, 8)}.pdf`);
    } catch (err) {
      alert('Gagal mendownload PDF: ' + err.message);
    }
  };

  const openedAt = new Date(shiftData.opened_at);
  const closedAt = shiftData.closed_at ? new Date(shiftData.closed_at) : new Date();
  const startingCash = Number(shiftData.starting_cash || 0);
  const cashSales = Number(shiftData.cash_sales || 0);
  const qrisSales = Number(shiftData.stats?.qrisSales || 0);
  const totalOmzet = cashSales + qrisSales;
  const expectedCash = Number(shiftData.expected_cash || (startingCash + cashSales));
  const actualCash = Number(shiftData.actual_cash || expectedCash);
  const discrepancy = Number(shiftData.discrepancy || (actualCash - expectedCash));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800 text-sm">Struk Rekap Shift (Z-Report)</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content / Kertas Struk 58mm */}
        <div className="p-4 overflow-y-auto flex-1 flex justify-center bg-slate-100/60">
          <div
            ref={receiptRef}
            className="w-[280px] bg-white p-4 text-[11px] font-mono leading-tight border border-slate-200 shadow-sm text-slate-800"
            style={{ fontFamily: '"Courier New", Courier, monospace' }}
          >
            {/* Header Toko */}
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              <h2 className="font-bold text-sm tracking-wide uppercase text-slate-900">
                {settings.storeName}
              </h2>
              <p className="text-[10px] text-slate-600 mt-0.5">{settings.address}</p>
              <p className="text-[10px] text-slate-600">{settings.phone}</p>
              <div className="mt-1.5 pt-1 border-t border-dashed border-slate-300">
                <p className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  REKAP TUTUP KASIR (Z-REPORT)
                </p>
              </div>
            </div>

            {/* Info Shift */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Shift ID:</span>
                <span>#{shiftData.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span className="font-bold">{shiftData.profiles?.name || 'Kasir'}</span>
              </div>
              <div className="flex justify-between">
                <span>Buka:</span>
                <span>{openedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({openedAt.toLocaleDateString('id-ID')})</span>
              </div>
              <div className="flex justify-between">
                <span>Tutup:</span>
                <span>{closedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ({closedAt.toLocaleDateString('id-ID')})</span>
              </div>
            </div>

            {/* Rincian Finansial Laci */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
              <div className="flex justify-between font-bold text-slate-900">
                <span>MODAL AWAL LACI:</span>
                <span>{formatRupiah(startingCash)}</span>
              </div>
              <div className="flex justify-between">
                <span>Penjualan Tunai:</span>
                <span>+{formatRupiah(cashSales)}</span>
              </div>
              <div className="flex justify-between">
                <span>Penjualan QRIS:</span>
                <span>{formatRupiah(qrisSales)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-300">
                <span>TOTAL OMZET SHIFT:</span>
                <span>{formatRupiah(totalOmzet)}</span>
              </div>
            </div>

            {/* Rekonsiliasi Kas Fisik */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[10px]">
              <div className="flex justify-between font-bold">
                <span>UANG SEHARUSNYA:</span>
                <span>{formatRupiah(expectedCash)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900">
                <span>UANG FISIK AKTUAL:</span>
                <span>{formatRupiah(actualCash)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-300">
                <span>SELISIH:</span>
                <span>
                  {discrepancy === 0
                    ? 'Rp 0 (PAS)'
                    : discrepancy > 0
                    ? `+${formatRupiah(discrepancy)} (LEBIH)`
                    : `${formatRupiah(discrepancy)} (KURANG)`}
                </span>
              </div>
            </div>

            {shiftData.notes && (
              <div className="py-1.5 border-b border-dashed border-slate-400 text-[10px]">
                <p className="font-bold">Catatan Kasir:</p>
                <p className="italic text-slate-600">{shiftData.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2 text-[10px] space-y-1 text-slate-500">
              <p>Struk ini sah sebagai bukti serah terima kasir.</p>
              <div className="pt-4 flex justify-between text-[9px] text-slate-400">
                <div className="text-center w-24">
                  <p>Kasir</p>
                  <p className="mt-6 border-b border-slate-400"></p>
                </div>
                <div className="text-center w-24">
                  <p>Supervisor/Owner</p>
                  <p className="mt-6 border-b border-slate-400"></p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center space-x-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
}

