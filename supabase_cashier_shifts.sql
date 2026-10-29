-- ============================================================
-- SKRIP TABEL KASIR SHIFT & MODAL AWAL LACI (CASH DRAWER FLOAT)
-- ============================================================

-- 1. Buat tabel cashier_shifts
CREATE TABLE IF NOT EXISTS public.cashier_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMPTZ,
    starting_cash NUMERIC NOT NULL DEFAULT 0,          -- Uang modal awal di laci
    cash_sales NUMERIC NOT NULL DEFAULT 0,             -- Total penjualan tunai selama shift
    expected_cash NUMERIC NOT NULL DEFAULT 0,          -- Uang seharusnya = starting_cash + cash_sales
    actual_cash NUMERIC,                               -- Uang fisik riil yang dihitung kasir saat tutup
    discrepancy NUMERIC,                               -- Selisih uang kasir (actual_cash - expected_cash)
    status TEXT NOT NULL DEFAULT 'open',               -- 'open' atau 'closed'
    notes TEXT                                         -- Catatan kasir / serah terima
);

-- 2. Tambahkan kolom shift_id dan payment_proof_url pada tabel transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.cashier_shifts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- 3. Aktifkan Row Level Security (RLS) & Berikan Akses Penuh
ALTER TABLE public.cashier_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access cashier_shifts" ON public.cashier_shifts;
CREATE POLICY "Public full access cashier_shifts" 
ON public.cashier_shifts 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 4. Indeks untuk performa pencarian shift aktif
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_status ON public.cashier_shifts(status);
CREATE INDEX IF NOT EXISTS idx_cashier_shifts_cashier_id ON public.cashier_shifts(cashier_id);

