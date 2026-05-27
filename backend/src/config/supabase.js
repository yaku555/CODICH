const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Falta SUPABASE_URL en el archivo .env');
}

if (!supabaseUrl.startsWith('http')) {
  throw new Error('SUPABASE_URL debe comenzar con https://');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el archivo .env');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

module.exports = supabase;