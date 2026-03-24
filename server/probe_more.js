const { supabase } = require('./config/supabase');
require('dotenv').config();

async function getFullConstraintInfo() {
  // Query to get check constraints from pg_catalog
  // We'll use a standard table query that should work if we have permission
  const { data, error } = await supabase.rpc('get_table_info', { table_name: 'users' });
  
  if (error) {
    console.log('RPC get_table_info failed, trying to probe for small/medium counterparts...');
    // Let's try to probe more values
    const moreValues = ['large', 'enterprise', 'shop', 'other'];
    for (const val of moreValues) {
        console.log(`Probing: ${val}`);
        const { error: insertError } = await supabase.from('users').insert({
          username: 'probe',
          gst_id: '05PROBE' + Math.random().toString(36).substring(2, 7).toUpperCase() + '1Z5',
          mobile: '0000000000',
          password_hash: 'hash',
          business_type: val
        });
        if (!insertError) {
          console.log(`✅ ${val} succeeded!`);
          await supabase.from('users').delete().eq('username', 'probe');
        } else {
          console.log(`❌ ${val} failed: ${insertError.message}`);
        }
    }
  } else {
    console.log(data);
  }
}

getFullConstraintInfo();
