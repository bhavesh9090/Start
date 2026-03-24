const { supabase } = require('./config/supabase');
require('dotenv').config();

async function checkAdminsSchema() {
  console.log('--- Checking admins table ---');
  const { data, error } = await supabase.from('admins').select('*').limit(1);
  if (error) {
    console.error('Error fetching from admins:', error);
  } else {
    console.log('Admins columns:', data.length > 0 ? Object.keys(data[0]) : 'No data found (but table exists)');
    if (data.length > 0) {
        console.log('Sample admin data:', data[0]);
    }
  }

  console.log('\n--- Checking districts table ---');
  const { data: districts, error: distError } = await supabase.from('districts').select('*').limit(1);
  if (distError) {
    console.error('Error fetching from districts:', distError);
  } else {
    console.log('Districts columns:', districts.length > 0 ? Object.keys(districts[0]) : 'No data found');
  }
}

checkAdminsSchema();
