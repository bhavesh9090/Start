const { supabase } = require('./config/supabase');
const fs = require('fs');
require('dotenv').config();

async function checkAdminMessagesSchema() {
  const { data, error } = await supabase.from('admin_messages').select('*').limit(1);
  if (error) {
    fs.writeFileSync('temp_messages_schema.txt', JSON.stringify(error, null, 2));
  } else {
    fs.writeFileSync('temp_messages_schema.txt', JSON.stringify(Object.keys(data[0] || {}), null, 2));
  }
}

checkAdminMessagesSchema();
