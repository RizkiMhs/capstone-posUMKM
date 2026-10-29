import { supabase } from '../lib/supabaseClient';

export const getExpenses = async () => {
  const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
  if (error) throw error;
  return data;
};

export const createExpense = async ({ expense_date, description, amount, category }) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([{ expense_date, description, amount, category }])
    .select()
    .single();
  if (error) throw error;
  return data;
};

