import { supabase } from '../lib/supabaseClient';

export const getCurrentShift = async (cashierId = null) => {
  if (cashierId) {
    const { data: userShift, error: uErr } = await supabase
      .from('cashier_shifts')
      .select('*, profiles(name)')
      .eq('status', 'open')
      .eq('cashier_id', cashierId)
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!uErr && userShift) return userShift;
  }

  const { data, error } = await supabase
    .from('cashier_shifts')
    .select('*, profiles(name)')
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const openShift = async ({ cashierId, startingCash, notes }) => {
  const numStartingCash = Math.max(0, Number(startingCash) || 0);

  const { data, error } = await supabase
    .from('cashier_shifts')
    .insert([
      {
        cashier_id: cashierId || null,
        starting_cash: numStartingCash,
        cash_sales: 0,
        expected_cash: numStartingCash,
        status: 'open',
        notes: notes || null,
      },
    ])
    .select('*, profiles(name)')
    .single();

  if (error) throw error;
  return data;
};

export const getShiftTransactions = async (shiftId) => {
  if (!shiftId) return [];
  const { data, error } = await supabase
    .from('transactions')
    .select('*, profiles(name), transaction_items(*, products(name))')
    .eq('shift_id', shiftId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const closeShift = async ({ shiftId, actualCash, notes }) => {
  const numActualCash = Math.max(0, Number(actualCash) || 0);

  // Ambil data shift saat ini
  const { data: shift, error: shiftErr } = await supabase
    .from('cashier_shifts')
    .select('*')
    .eq('id', shiftId)
    .single();

  if (shiftErr) throw shiftErr;

  // Hitung ulang akumulasi transaksi tunai shift ini
  const { data: txs, error: txErr } = await supabase
    .from('transactions')
    .select('total_amount, payment_method')
    .eq('shift_id', shiftId);

  if (txErr) throw txErr;

  const cashSales = (txs || [])
    .filter((t) => t.payment_method === 'tunai')
    .reduce((sum, t) => sum + Number(t.total_amount || 0), 0);

  const startingCash = Number(shift.starting_cash || 0);
  const expectedCash = startingCash + cashSales;
  const discrepancy = numActualCash - expectedCash;

  const { data, error } = await supabase
    .from('cashier_shifts')
    .update({
      closed_at: new Date().toISOString(),
      cash_sales: cashSales,
      expected_cash: expectedCash,
      actual_cash: numActualCash,
      discrepancy: discrepancy,
      status: 'closed',
      notes: notes || shift.notes || null,
    })
    .eq('id', shiftId)
    .select('*, profiles(name)')
    .single();

  if (error) throw error;
  return data;
};

export const getAllShifts = async ({ startDate = null, endDate = null } = {}) => {
  let query = supabase
    .from('cashier_shifts')
    .select('*, profiles(name)')
    .order('opened_at', { ascending: false });

  if (startDate) {
    query = query.gte('opened_at', `${startDate}T00:00:00.000Z`);
  }
  if (endDate) {
    query = query.lte('opened_at', `${endDate}T23:59:59.999Z`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

