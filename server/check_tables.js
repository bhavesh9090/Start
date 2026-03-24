const { supabase } = require('./config/supabase');
require('dotenv').config();

async function checkTables() {
  const tables = ['users', 'admins', 'audit_logs', 'login_attempts', 'chatbot_history', 'reports', 'payments', 'districts', 'tax_records', 'complaints', 'chat_history'];
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(1);
      if (!error) {
        console.log(`Table exists: ${t}`);
        if (data && data.length > 0) {
          console.log(`Columns in ${t}:`, Object.keys(data[0]));
        } else {
          // If no data, try to get columns via a dummy query if possible, or just note it exists
          console.log(`Table ${t} exists but is empty.`);
        }
      }
    } catch (e) {
      // Ignored
    }
  }
}

checkTables();
