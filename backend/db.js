const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

async function all(table, filters = {}, options = {}) {
  let query = supabase.from(table).select(options.select || '*');
  Object.entries(filters).forEach(([key, val]) => { query = query.eq(key, val); });
  if (options.order) query = query.order(options.order, { ascending: false });
  if (options.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function get(table, filters = {}, options = {}) {
  let query = supabase.from(table).select(options.select || '*');
  Object.entries(filters).forEach(([key, val]) => { query = query.eq(key, val); });
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function insert(table, payload) {
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}

async function update(table, filters = {}, payload = {}) {
  let query = supabase.from(table).update(payload);
  Object.entries(filters).forEach(([key, val]) => { query = query.eq(key, val); });
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}

async function getDb() {
  const { error } = await supabase.from('users').select('id').limit(1);
  if (error) throw new Error('Connexion Supabase échouée : ' + error.message);
  return true;
}

module.exports = { supabase, getDb, all, get, insert, update };
