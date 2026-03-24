const { supabase } = require('./config/supabase');
require('dotenv').config();

async function getConstraint() {
  // Querying pg_constraint table to see check constraints
  const { data, error } = await supabase.rpc('get_table_constraints', { t_name: 'users' });
  
  // If RPC is not available, we can try a raw query if we have an endpoint or just try a different approach
  if (error) {
     console.log('RPC failed, trying raw query via select...');
     // Note: we can't do raw SQL via supabase-js easily unless there is an extension
     // But we can try to find the error message details again
     console.error(error);
  } else {
     console.log(data);
  }
}

// Since I can't easily run raw SQL or RPC without knowing if they exist,
// I will try to "probe" the allowed values by trying a few common ones.
async function probeValues() {
  const values = ['small', 'medium', 'Retail', 'Service', 'Other'];
  for (const val of values) {
    console.log(`Probing value: ${val}`);
    const { error } = await supabase.from('users').insert({
      username: 'probe',
      gst_id: '05PROBE' + Math.random().toString(36).substring(2, 7).toUpperCase() + '1Z5',
      mobile: '0000000000',
      password_hash: 'hash',
      business_type: val
    });
    if (error && error.message.includes('check constraint')) {
      console.log(`❌ ${val} failed`);
    } else if (error) {
      console.log(`❓ ${val} failed with other error: ${error.message}`);
    } else {
      console.log(`✅ ${val} succeeded!`);
      // Clean up
      await supabase.from('users').delete().eq('username', 'probe');
    }
  }
}

probeValues();
