const { supabase } = require('./config/supabase');
require('dotenv').config();

async function checkSchema() {
  const { data, error } = await supabase.from('users').select('business_type').limit(10);
  if (error) {
    console.log(error);
  } else {
    console.log(data);
  }
}

checkSchema();
