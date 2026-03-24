const { supabase } = require('./config/supabase');
const fs = require('fs');
require('dotenv').config();

async function checkAdminsSchema() {
  const { data, error } = await supabase.from('admins').select('*').limit(1);
  if (error) {
    fs.writeFileSync('temp_schema.txt', JSON.stringify(error, null, 2));
  } else {
    fs.writeFileSync('temp_schema.txt', JSON.stringify(Object.keys(data[0] || {}), null, 2));
  }
}

checkAdminsSchema();
