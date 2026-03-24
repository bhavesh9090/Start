const { supabase } = require('./config/supabase');
require('dotenv').config();

async function checkConstraints() {
  // We can't easily get full schema via supabase-js without RPC or raw SQL
  // But we can try to insert a dummy record with minimal info to see what fails
  console.log('Attempting to insert dummy user with minimal info...');
  const { data, error } = await supabase
    .from('users')
    .insert({
      username: 'test_temp',
      gst_id: '05AAAAA0000A1Z5', // Valid-ish format
      mobile: '0000000000',
      password_hash: 'hash',
      business_type: 'small'
    })
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert succeeded, cleaning up...');
    await supabase.from('users').delete().eq('id', data.id);
  }
}

checkConstraints();
