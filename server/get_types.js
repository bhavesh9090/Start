const { supabase } = require('./config/supabase');
require('dotenv').config();

async function getDistinctBusTypes() {
  const { data, error } = await supabase.from('users').select('business_type');
  if (error) {
    console.error(error);
  } else {
    const types = [...new Set(data.map(i => i.business_type))];
    console.log('Existing business types in DB:', types);
  }
}

getDistinctBusTypes();
