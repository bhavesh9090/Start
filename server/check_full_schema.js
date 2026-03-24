const { supabase } = require('./config/supabase');
require('dotenv').config();

async function checkFullSchema() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('User columns:', data.length > 0 ? Object.keys(data[0]) : 'No data found');
    
    // Also check audit_logs table
    const { error: auditError } = await supabase.from('audit_logs').select('*').limit(1);
    if (auditError) {
       console.error('Error fetching audit_logs:', auditError);
    } else {
       console.log('audit_logs table exists');
    }

    // Also check login_attempts table
    const { error: loginError } = await supabase.from('login_attempts').select('*').limit(1);
    if (loginError) {
       console.error('Error fetching login_attempts:', loginError);
    } else {
       console.log('login_attempts table exists');
    }
  }
}

checkFullSchema();
