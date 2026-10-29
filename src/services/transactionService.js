import { supabase } from '../lib/supabaseClient';

export const createTransaction = async ({ cashierId, totalAmount, paymentMethod, orderType, items }) => {
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert([
      {
        cashier_id: cashierId || null,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        order_type: orderType,
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

  return transaction;
};

export const getTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, profiles(name), transaction_items(*, products(name))')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

